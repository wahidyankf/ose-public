"use client";

export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import { EditRoutineScreen } from "@/contexts/routine/presentation";
import { useAppRuntime } from "@/contexts/app-shell/presentation/app-runtime-context";

/**
 * /app/routines/edit — wraps EditRoutineScreen.
 *
 * The routine being edited lives in AppRuntime context (set by Home before
 * pushing this URL). A null routine indicates "create new routine" — that is
 * intentional and supported by EditRoutineScreen, so no redirect on null.
 */
export default function EditRoutinePage() {
  const router = useRouter();
  const { runtime, editingRoutine, refreshHome, setEditingRoutine } = useAppRuntime();

  const handleBack = () => {
    setEditingRoutine(null);
    router.push("/app/home");
  };

  const handleSave = () => {
    setEditingRoutine(null);
    refreshHome();
    router.push("/app/home");
  };

  return <EditRoutineScreen routine={editingRoutine} runtime={runtime} onSave={handleSave} onBack={handleBack} />;
}
