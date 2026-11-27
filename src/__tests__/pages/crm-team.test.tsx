import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TeamView, {
  type AgenciesApiResponse,
  type TeamApiResponse,
} from "@/app/crm/team/team-view";
import { toast } from "sonner";

jest.setTimeout(20000);

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockFetch = jest.fn();

const adminTeamFixture: TeamApiResponse = {
  currentUser: {
    user_id: "user-admin-1",
    email: "founder@agencyone.test",
    role: "admin",
    agency_id: "agency-1",
    agency_name: "Agency One",
    agency_slug: "agency-one",
    is_platform_admin: false,
  },
  staff: [
    {
      user_id: "user-admin-1",
      email: "founder@agencyone.test",
      role: "admin",
      active: true,
    },
    {
      user_id: "user-staff-2",
      email: "alex@agencyone.test",
      role: "staff",
      active: true,
    },
  ],
  clients: [
    {
      user_id: "user-client-1",
      email: "buyer@clientco.test",
      company_id: "comp-1",
      company_name: "ClientCo Labs",
      active: true,
      can_accept_proposals: true,
    },
  ],
  companies: [
    { id: "comp-1", name: "ClientCo Labs" },
    { id: "comp-2", name: "Northstar Retail" },
  ],
};

const platformAdminTeamFixture: TeamApiResponse = {
  ...adminTeamFixture,
  currentUser: {
    ...adminTeamFixture.currentUser,
    user_id: "user-root-1",
    email: "admin@agencydesk.com",
    agency_id: "a0000000-0000-4000-8000-000000000001",
    agency_name: "AgencyDesk Root",
    agency_slug: "agencydesk",
    is_platform_admin: true,
  },
  staff: [
    {
      user_id: "user-root-1",
      email: "admin@agencydesk.com",
      role: "admin",
      active: true,
    },
  ],
};

const agenciesFixture: AgenciesApiResponse = {
  agencies: [
    {
      id: "agency-1",
      name: "Agency One",
      slug: "agency-one",
      intake_enabled: true,
      created_at: "2026-11-20T00:00:00.000Z",
      staff_count: 2,
      admins: [{ user_id: "user-admin-1", email: "founder@agencyone.test" }],
    },
  ],
};

function cloneFixture<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function okJson(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response);
}

describe("TeamView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  it("supports admin staff invite, role update, and deactivation flows", async () => {
    const user = userEvent.setup();
    let currentTeam: TeamApiResponse = cloneFixture(adminTeamFixture);

    mockFetch.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (url === "/api/crm/team" && method === "GET") {
        return okJson(currentTeam);
      }
      if (url === "/api/crm/team" && method === "POST") {
        const payload = JSON.parse(String(init?.body));
        currentTeam = {
          ...currentTeam,
          staff: [
            ...currentTeam.staff,
            {
              user_id: "user-staff-3",
              email: payload.email,
              role: payload.role,
              active: true,
            },
          ],
        };
        return okJson({ ok: true, invited: true }, 201);
      }
      if (url === "/api/crm/team" && method === "PATCH") {
        const payload = JSON.parse(String(init?.body));
        currentTeam = {
          ...currentTeam,
          staff: currentTeam.staff.map((m) =>
            m.user_id === payload.user_id
              ? {
                  ...m,
                  ...(payload.role !== undefined ? { role: payload.role } : {}),
                  ...(payload.active !== undefined ? { active: payload.active } : {}),
                }
              : m
          ),
        };
        return okJson({ ok: true });
      }
      throw new Error(`Unexpected fetch ${method} ${url}`);
    });

    render(<TeamView />);

    await waitFor(() =>
      expect(screen.getByText("founder@agencyone.test")).toBeInTheDocument()
    );

    // Onboarding banner and agency info
    expect(
      screen.getByRole("region", { name: /invite and sso onboarding guide/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Google SSO/i)).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /client agencies/i })).not.toBeInTheDocument();

    // Self-row controls are disabled
    expect(screen.getByLabelText("Role for founder@agencyone.test")).toBeDisabled();
    expect(screen.getByLabelText("Deactivate founder@agencyone.test")).toBeDisabled();

    // Invite new staff member
    await user.type(screen.getByLabelText(/staff email address/i), "newstaff@agencyone.test");
    await user.selectOptions(screen.getByLabelText(/workspace role/i), "admin");
    await user.click(screen.getByRole("button", { name: /invite staff member/i }));

    await waitFor(() =>
      expect(screen.getByText("newstaff@agencyone.test")).toBeInTheDocument()
    );
    expect(toast.success).toHaveBeenCalledWith("Staff access granted for newstaff@agencyone.test");

    // Change role of existing staff member
    await user.selectOptions(screen.getByLabelText("Role for alex@agencyone.test"), "admin");
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Updated alex@agencyone.test to admin")
    );

    // Deactivate existing staff member
    await user.click(screen.getByLabelText("Deactivate alex@agencyone.test"));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("alex@agencyone.test deactivated")
    );
    expect(screen.getByLabelText("Reactivate alex@agencyone.test")).toBeInTheDocument();

    // Ensure /api/crm/agencies was never called for non-platform admin
    expect(mockFetch).not.toHaveBeenCalledWith("/api/crm/agencies", expect.anything());
  });

  it("renders read-only state for non-admin staff without mutation controls", async () => {
    const user = userEvent.setup();
    const staffOnlyFixture: TeamApiResponse = {
      ...adminTeamFixture,
      currentUser: {
        ...adminTeamFixture.currentUser,
        user_id: "user-staff-2",
        email: "alex@agencyone.test",
        role: "staff",
      },
    };

    mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
      if (String(input) === "/api/crm/team") return okJson(staffOnlyFixture);
      throw new Error(`Unexpected fetch ${String(input)}`);
    });

    render(<TeamView />);

    await waitFor(() =>
      expect(screen.getByText(/read-only view:/i)).toBeInTheDocument()
    );

    expect(screen.queryByLabelText(/staff email address/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/role for alex@agencyone.test/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/deactivate founder@agencyone.test/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /client agencies/i })).not.toBeInTheDocument();

    // Client tab is also read-only
    await user.click(screen.getByRole("tab", { name: /client portal access/i }));
    expect(screen.queryByLabelText(/client email address/i)).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(/toggle proposal approval for buyer@clientco.test/i)
    ).not.toBeInTheDocument();
    expect(screen.getByText("buyer@clientco.test")).toBeInTheDocument();
  });

  it("supports Client Portal Access invite and permission toggles for admins", async () => {
    const user = userEvent.setup();
    let currentTeam: TeamApiResponse = cloneFixture(adminTeamFixture);

    mockFetch.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (url === "/api/crm/team" && method === "GET") return okJson(currentTeam);
      if (url === "/api/crm/team" && method === "POST") {
        const payload = JSON.parse(String(init?.body));
        const company = currentTeam.companies.find((c) => c.id === payload.company_id);
        currentTeam = {
          ...currentTeam,
          clients: [
            ...currentTeam.clients,
            {
              user_id: "user-client-2",
              email: payload.email,
              company_id: payload.company_id,
              company_name: company?.name ?? "Unknown",
              active: true,
              can_accept_proposals: payload.can_accept_proposals,
            },
          ],
        };
        return okJson({ ok: true, invited: true }, 201);
      }
      if (url === "/api/crm/team" && method === "PATCH") {
        const payload = JSON.parse(String(init?.body));
        currentTeam = {
          ...currentTeam,
          clients: currentTeam.clients.map((c) =>
            c.user_id === payload.user_id && c.company_id === payload.company_id
              ? {
                  ...c,
                  ...(payload.active !== undefined ? { active: payload.active } : {}),
                  ...(payload.can_accept_proposals !== undefined
                    ? { can_accept_proposals: payload.can_accept_proposals }
                    : {}),
                }
              : c
          ),
        };
        return okJson({ ok: true });
      }
      throw new Error(`Unexpected fetch ${method} ${url}`);
    });

    render(<TeamView />);

    await waitFor(() =>
      expect(screen.getByText("founder@agencyone.test")).toBeInTheDocument()
    );

    await user.click(screen.getByRole("tab", { name: /client portal access/i }));

    await user.type(screen.getByLabelText(/client email address/i), "pm@northstar.test");
    await user.selectOptions(screen.getByLabelText(/client company/i), "comp-2");
    await user.click(screen.getByRole("button", { name: /grant portal access/i }));

    await waitFor(() => expect(screen.getByText("pm@northstar.test")).toBeInTheDocument());
    expect(toast.success).toHaveBeenCalledWith("Client portal access granted for pm@northstar.test");

    // Toggle proposal approval off for buyer@clientco.test
    await user.click(
      screen.getByLabelText("Toggle proposal approval for buyer@clientco.test at ClientCo Labs")
    );
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Updated portal permissions for buyer@clientco.test"
      )
    );

    const clientTable = screen.getByRole("table", { name: /client portal access/i });
    expect(within(clientTable).getByText("View Only")).toBeInTheDocument();
  });

  it("shows Client Agencies & Founders tab for Platform Admin and handles onboarding + intake toggle", async () => {
    const user = userEvent.setup();
    let currentAgencies: AgenciesApiResponse = cloneFixture(agenciesFixture);

    mockFetch.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (url === "/api/crm/team" && method === "GET") return okJson(platformAdminTeamFixture);
      if (url === "/api/crm/agencies" && method === "GET") return okJson(currentAgencies);
      if (url === "/api/crm/agencies" && method === "POST") {
        const payload = JSON.parse(String(init?.body));
        currentAgencies = {
          agencies: [
            ...currentAgencies.agencies,
            {
              id: "agency-2",
              name: payload.name,
              slug: payload.slug,
              intake_enabled: true,
              created_at: "2026-11-27T00:00:00.000Z",
              staff_count: 1,
              admins: [{ user_id: "user-founder-2", email: payload.founder_email }],
            },
          ],
        };
        return okJson({ ok: true }, 201);
      }
      if (url === "/api/crm/agencies" && method === "PATCH") {
        const payload = JSON.parse(String(init?.body));
        currentAgencies = {
          agencies: currentAgencies.agencies.map((a) =>
            a.id === payload.id ? { ...a, intake_enabled: payload.intake_enabled } : a
          ),
        };
        return okJson({ ok: true });
      }
      throw new Error(`Unexpected fetch ${method} ${url}`);
    });

    render(<TeamView />);

    const agenciesTab = await screen.findByRole("tab", {
      name: /client agencies & founders/i,
    });
    await user.click(agenciesTab);

    await user.type(screen.getByLabelText(/agency name/i), "Nova Growth Studio");
    expect(screen.getByLabelText(/workspace slug/i)).toHaveValue("nova-growth-studio");

    await user.type(screen.getByLabelText(/founder email/i), "ceo@novagrowth.test");
    await user.click(screen.getByRole("button", { name: /create agency & invite founder/i }));

    await waitFor(() => expect(screen.getByText("Nova Growth Studio")).toBeInTheDocument());
    expect(screen.getByText("ceo@novagrowth.test")).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith(
      'Created agency "Nova Growth Studio" and invited founder ceo@novagrowth.test'
    );

    // Pause intake for Agency One
    await user.click(screen.getByLabelText("Pause intake for Agency One"));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Public intake paused for Agency One")
    );
    expect(screen.getByLabelText("Enable intake for Agency One")).toBeInTheDocument();
  });

  it("displays an error toast when inviting returns an API conflict", async () => {
    const user = userEvent.setup();

    mockFetch.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      if (url === "/api/crm/team" && method === "GET") return okJson(adminTeamFixture);
      if (url === "/api/crm/team" && method === "POST") {
        return okJson({ error: "User already belongs to another agency." }, 409);
      }
      throw new Error(`Unexpected fetch ${method} ${url}`);
    });

    render(<TeamView />);
    await waitFor(() =>
      expect(screen.getByText("founder@agencyone.test")).toBeInTheDocument()
    );

    await user.type(screen.getByLabelText(/staff email address/i), "taken@otheragency.test");
    await user.click(screen.getByRole("button", { name: /invite staff member/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("User already belongs to another agency.")
    );
  });
});
