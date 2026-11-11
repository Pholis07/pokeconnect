"""Genera el catálogo local desde los CSV oficiales de PokeAPI (sin dependencias)."""
import csv
import io
import json
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/'
FILES = ['pokemon', 'pokemon_species', 'stats', 'types', 'pokemon_types', 'pokemon_stats', 'moves', 'move_names', 'pokemon_moves', 'pokemon_species_flavor_text', 'pokemon_evolution', 'item_names', 'type_efficacy', 'languages', 'location_names']

def download(name):
    raw = subprocess.run(['curl', '--fail', '--retry', '2', '--max-time', '90', '-s', BASE + name + '.csv'], capture_output=True, text=True, check=True).stdout
    return name, list(csv.DictReader(io.StringIO(raw)))

with ThreadPoolExecutor(max_workers=4) as pool:
    tables = dict(pool.map(download, FILES))
es = next(row['id'] for row in tables['languages'] if row['identifier'] == 'es')
labels = lambda name, key: {row[key]: row['name'] for row in tables[name] if row['local_language_id'] == es}
move_names = labels('move_names', 'move_id')
item_names = labels('item_names', 'item_id')
locations = labels('location_names', 'location_id')
types = {row['id']: row['identifier'] for row in tables['types']}
stats = {row['id']: row['identifier'] for row in tables['stats']}
species = {row['id']: row for row in tables['pokemon_species']}
rows = {row['id']: row for row in tables['pokemon'] if int(row['id']) <= 1025}
names = json.loads((ROOT / 'src/lib/pokemon-names.json').read_text())
assert all(rows[str(i)]['identifier'] == name for i, name in enumerate(names, 1))
poke_types, poke_stats, descriptions, learnsets = {}, {}, {}, {}
for row in tables['pokemon_types']:
    poke_types.setdefault(row['pokemon_id'], []).append((int(row['slot']), types[row['type_id']]))
for row in tables['pokemon_stats']:
    poke_stats.setdefault(row['pokemon_id'], {})[stats[row['stat_id']]] = int(row['base_stat'])
for row in tables['pokemon_species_flavor_text']:
    if row['language_id'] == es:
        descriptions[row['species_id']] = ' '.join(row['flavor_text'].split())
moves = {}
for row in tables['moves']:
    if row['power'] and int(row['power']) > 0 and row['type_id'] in types:
        moves[row['id']] = dict(id=int(row['id']), name=move_names.get(row['id'], row['identifier']), type=types[row['type_id']], power=int(row['power']), accuracy=int(row['accuracy'] or 0) or 100, pp=int(row['pp'] or 5), category='special' if row['damage_class_id'] == '3' else 'physical')
for row in tables['pokemon_moves']:
    if row['pokemon_id'] not in rows or row['pokemon_move_method_id'] != '1' or row['move_id'] not in moves:
        continue
    version = int(row['version_group_id'])
    current = learnsets.setdefault(row['pokemon_id'], (version, {}))
    if version > current[0]:
        current = (version, {})
        learnsets[row['pokemon_id']] = current
    if version == current[0]:
        current[1][row['move_id']] = int(row['level'])

def condition(row):
    parts = []
    simple = {'minimum_level': 'Nivel', 'minimum_happiness': 'Amistad mínima', 'minimum_beauty': 'Belleza mínima', 'minimum_affection': 'Afecto mínimo'}
    for field, title in simple.items():
        if row.get(field): parts.append(f'{title} {row[field]}')
    for field, title in [('trigger_item_id', 'Usar'), ('held_item_id', 'Llevar')]:
        if row.get(field): parts.append(title + ' ' + item_names.get(row[field], 'objeto ' + row[field]))
    if row.get('time_of_day'): parts.append({'day':'De día','night':'De noche','dusk':'Al atardecer'}.get(row['time_of_day'], row['time_of_day']))
    if row.get('gender_id'): parts.append({'1':'Hembra','2':'Macho','3':'Sin género'}[row['gender_id']])
    if row.get('known_move_id'): parts.append('Conocer ' + move_names.get(row['known_move_id'], row['known_move_id']))
    if row.get('known_move_type_id'): parts.append('Conocer movimiento de tipo ' + types[row['known_move_type_id']])
    if row.get('location_id'): parts.append('En ' + locations.get(row['location_id'], 'ubicación ' + row['location_id']))
    if row.get('relative_physical_stats'): parts.append({'-1':'Ataque menor que defensa','0':'Ataque igual a defensa','1':'Ataque mayor que defensa'}.get(row['relative_physical_stats'], ''))
    for field, title in [('party_species_id','En el equipo: '),('trade_species_id','Intercambiar por ')]:
        if row.get(field): parts.append(title + species[row[field]]['identifier'])
    if row.get('party_type_id'): parts.append('Equipo con tipo ' + types[row['party_type_id']])
    if row.get('needs_overworld_rain') == '1': parts.append('Con lluvia')
    if row.get('turn_upside_down') == '1': parts.append('Invertir el dispositivo')
    trigger = row['evolution_trigger_id']
    if trigger == '2': parts.insert(0, 'Intercambio')
    elif trigger not in ('1','3'): parts.insert(0, {'4':'Espacio libre en el equipo y Poké Ball','5':'Giro con objeto equipado','6':'Daño recibido bajo un arco de piedra','7':'Caminar con el Pokémon','8':'Multijugador','9':'Combate','10':'Usar un movimiento repetidamente','11':'Recoger monedas','12':'Derrotar rivales específicos','13':'Recoger objetos'}.get(trigger, 'Condición de evolución especial'))
    return ' · '.join(parts) or 'Subir de nivel'

evolutions = {}
for row in tables['pokemon_evolution']:
    sid = row['evolved_species_id']
    if sid not in species or int(sid) > 1025: continue
    sp = species[sid]
    evolutions.setdefault(sp['evolution_chain_id'], []).append(dict(id=int(sid), name=names[int(sid)-1], parent=int(sp['evolves_from_species_id'] or 0), condition=condition(row)))
result = []
for id_, row in rows.items():
    sp = species[row['species_id']]
    learned = learnsets.get(id_, (0, {}))[1]
    selected = sorted(learned, key=lambda m: (learned[m], moves[m]['power']), reverse=True)
    diverse = []
    for mid in selected:
        if not any(moves[mid]['type'] == moves[other]['type'] for other in diverse): diverse.append(mid)
    for mid in selected:
        if mid not in diverse: diverse.append(mid)
    chain = evolutions.get(sp['evolution_chain_id'], [])
    root = sp
    while root['evolves_from_species_id']:
        root = species[root['evolves_from_species_id']]
    root_id = int(root['id'])
    family = [dict(id=root_id, name=names[root_id-1], parent=0, condition='Forma inicial')] + chain if root_id <= 1025 else chain
    # Varias condiciones alternativas pueden conducir a la misma evolución.
    merged = {}
    for node in family:
        if node['id'] in merged: merged[node['id']]['condition'] += ' / ' + node['condition']
        else: merged[node['id']] = dict(node)
    # Forcejeo permite combatir a especies que solo aprenden movimientos de estado.
    result.append(dict(id=int(id_), name=row['identifier'], generation=int(sp['generation_id']), types=[v for _,v in sorted(poke_types[id_])], stats=poke_stats[id_], description=descriptions.get(row['species_id'], 'Sin descripción en español disponible.'), moves=[moves[m] for m in diverse[:4]] or [moves['165']], evolutions=list(merged.values())))
assert len(result) == 1025
assert all(len(p['stats']) == 6 and p['types'] for p in result)
assert all(p['moves'] for p in result), 'Todo Pokémon necesita un movimiento de daño en el simulador'
chart = {}
for row in tables['type_efficacy']:
    if row['damage_type_id'] in types and row['target_type_id'] in types:
        chart.setdefault(types[row['damage_type_id']], {})[types[row['target_type_id']]] = int(row['damage_factor']) / 100
(ROOT / 'src/lib/pokemon-data.json').write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n')
(ROOT / 'src/lib/type-chart.json').write_text(json.dumps(chart, separators=(',', ':')) + '\n')
print(f'Catálogo: {len(result)} Pokémon, tipos, seis estadísticas, descripción, evoluciones y cuatro movimientos; {len(chart)} tipos en tabla de daño.')
