import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { App } from "../App";
import { AnswersProvider } from "../state/answers";

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

type Handler = (init?: RequestInit) => Response | Promise<Response>;

/** Replace fetch with a router keyed by "METHOD /path". Any other request fails the test. */
export function mockFetch(handlers: Record<string, Handler>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const key = `${init?.method ?? "GET"} ${String(input)}`;
    const handler = handlers[key];
    if (!handler) throw new Error(`Unexpected request: ${key}`);
    return handler(init);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

export function renderApp(path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AnswersProvider>
        <App />
      </AnswersProvider>
    </MemoryRouter>,
  );
}

/** Pre-fill the answers the app keeps in sessionStorage. */
export function seedAnswers(answers: Record<number, string>) {
  sessionStorage.setItem("np.answers", JSON.stringify(answers));
}
