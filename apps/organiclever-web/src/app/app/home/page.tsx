"use client";

export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import type { Routine } from "@/contexts/routine/application";
import { HomeScreen } from "@/components/app/home/home-screen";
import { useAppRuntime } from "@/components/app/app-runtime-context";

export default function HomePage() {
  const router = useRouter();
  const { runtime, refreshKey, setActiveRoutine, setEditingRoutine } = useAppRuntime();

  const handleStartWorkout = (routine?: Routine) => {
    setActiveRoutine(routine ?? null);
    router.push("/app/workout");
  };

  const handleEditRoutine = (routine?: Routine) => {
    setEditingRoutine(routine ?? null);
    router.push("/app/routines/edit");
  };

  return (
    <HomeScreen
      key={refreshKey}
      runtime={runtime}
      onStartWorkout={handleStartWorkout}
      onEditRoutine={handleEditRoutine}
    />
  );
}
