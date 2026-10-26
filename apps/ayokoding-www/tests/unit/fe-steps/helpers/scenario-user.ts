import userEvent, { type UserEvent } from "@testing-library/user-event";

export type ScenarioUser = Pick<UserEvent, "click" | "clear" | "selectOptions" | "type">;

export function createScenarioUser(registerCleanup: (cleanup: () => void) => void): ScenarioUser {
  let session: UserEvent | undefined;

  function currentSession(): UserEvent {
    if (session === undefined) {
      session = userEvent.setup();
      registerCleanup(() => {
        session = undefined;
      });
    }
    return session;
  }

  return {
    click: (...args: Parameters<UserEvent["click"]>) => currentSession().click(...args),
    clear: (...args: Parameters<UserEvent["clear"]>) => currentSession().clear(...args),
    selectOptions: (...args: Parameters<UserEvent["selectOptions"]>) => currentSession().selectOptions(...args),
    type: (...args: Parameters<UserEvent["type"]>) => currentSession().type(...args),
  };
}
