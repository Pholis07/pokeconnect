# PokeConnect

Pokédex móvil con Expo SDK 58 y Expo Router. Incluye 1025 Pokémon, cartas reales del JCC y un pasaporte de exploración.

## Funciones

- Búsqueda por nombre o número y filtros combinados de tipo, generación y favoritos.
- Fichas con estadísticas, descripción en español, evoluciones y condiciones, disponibles sin conexión.
- Favoritos, equipo de seis, análisis de debilidades compartidas y comparador de dos Pokémon.
- Descarga explícita de imágenes de las fichas y cartas para consultarlas sin conexión.
- Cartas reales en español e inglés: búsqueda, expansión, rareza, ilustrador, ataques, álbum de favoritas y vista de baraja deslizable.
- Combate simplificado con movimientos, PP del jugador, precisión, velocidad, ataques físicos/especiales, STAB, tipos e inmunidades. No simula estados, habilidades ni todas las reglas de los juegos oficiales.
- Pasaporte de entrenador: tres rutas conectan exploración, equipo, victorias, fichas descargadas y cartas. Los sellos se entregan al cumplir los requisitos y se conservan al cerrar la app.
- Modo oscuro, movimiento reducido y gestos en el hilo de UI. La baraja tiene controles por botón además del arrastre.

Favoritos, equipo, álbum, imágenes descargadas y pasaporte se guardan **en el dispositivo**. No hay sincronización de progreso en la nube. El álbum contiene cartas favoritas, no una certificación de propiedad de cartas físicas.

## Ejecutar

Requiere Node.js con soporte para TypeScript nativo para las pruebas (Node 22.18+), npm y Expo Go compatible con SDK 58.

```bash
npm install
npx expo start --go
```

Escanea el QR en Expo Go con el teléfono y la computadora en la misma red. Para redes con aislamiento o datos móviles:

```bash
npm install --global @expo/ngrok@^4.1.0
npx expo start --go --tunnel ngrok
```

El túnel requiere que la computadora permanezca encendida y conectada. Su enlace puede cambiar al reiniciarlo. También están disponibles `npm run web`, `npm run android` y `npm run ios`.

## Datos y modo sin conexión

Los datos básicos de los 1025 Pokémon, tipos, estadísticas, descripciones y evoluciones vienen incluidos en `src/lib/pokemon-data.json`. No se descargan 1025 fichas para filtrar la lista. Las imágenes y las cartas nuevas requieren internet hasta descargarse. Las consultas realizadas a TCGdex se almacenan localmente.

El catálogo se genera desde los [CSV oficiales de PokéAPI](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv). Para actualizar la instantánea (Python 3 y curl, sin paquetes adicionales):

```bash
python3 scripts/sync-pokemon-data.py
npm test
```

La instantánea está acotada a los números nacionales 1–1025. El simulador selecciona hasta cuatro movimientos de daño aprendidos por nivel; las especies sin movimientos de daño usan Forcejeo. No es un editor completo de movimientos.

Las cartas y sus imágenes proceden de [TCGdex](https://tcgdex.dev/). Las variantes e imágenes dependen de la disponibilidad de cada idioma. Pokémon y las ilustraciones pertenecen a sus respectivos titulares.

Las interacciones nativas se inspiran en [React Bits](https://reactbits.dev/get-started/index): Stack, Tilted Card, Spotlight Card, Animated Content, Count Up y Click Spark. Se implementan con React Native y Reanimated; no se ejecutan componentes DOM ni efectos WebGL en una webview.

## Validación

```bash
npm run lint
npx tsc --noEmit
npm test
```

Las pruebas cubren el catálogo completo, límites e hidratación del progreso, daño por tipos, inmunidades, STAB, precisión, velocidad y fin del combate. La calibración de gestos, vibración y rendimiento requiere un dispositivo físico.
