import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { initializeTrainer, useTrainer } from "../lib/trainer";
import { Button } from "../components/Button";
import { Copy } from "../components/ui";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack } from "expo-router";
import { useTheme } from "../theme";

export default function RootLayout() {
  const t = useTheme();
  const state = useTrainer();
  useEffect(() => {
    void initializeTrainer();
  }, []);
  if (!state.ready)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: t.bg,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          gap: 16,
        }}
      >
        {state.error ? (
          <>
            <Copy>{state.error}</Copy>
            <Button
              title="Reintentar lectura"
              onPress={() => {
                void initializeTrainer();
              }}
            />
          </>
        ) : (
          <ActivityIndicator color={t.tint} size="large" />
        )}
      </View>
    );
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.bg },
          headerShadowVisible: false,
          headerTintColor: t.tint,
          headerTitleStyle: { color: t.text },
          contentStyle: { backgroundColor: t.bg },
        }}
      />
    </GestureHandlerRootView>
  );
}
