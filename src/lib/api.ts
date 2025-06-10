const API_BASE_URL = import.meta.env.DEV
  ? "http://localhost/social-recruiting-crm/api"
  : "/api";

export interface User {
  id: number;
  username: string;
  email: string;
  role: "super_admin" | "tenant_admin" | "admin" | "user";
  tenant_id?: number;
  created_at: string;
  tenant?: {
    id: number;
    name: string;
    subdomain: string;
    settings: any;
    branding: any;
  };
}

export interface Tenant {
  id: number;
  name: string;
  subdomain: string;
  domain?: string;
  status: "active" | "inactive" | "suspended";
  plan: "free" | "basic" | "pro" | "enterprise";
  max_users: number;
  max_pages: number;
  user_count?: number;
  page_count?: number;
  submission_count?: number;
  created_at: string;
  settings: any;
  branding: any;
}

export interface LandingPage {
  id: number;
  title: string;
  slug: string;
  header_image?: string;
  header_text?: string;
  header_overlay_color?: string;
  header_overlay_opacity?: number;
  header_height?: number;
  content_blocks: ContentBlock[];
  status: "draft" | "published";
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface ContentBlock {
  id: string;
  type: "header" | "text" | "richtext" | "image" | "button" | "list" | "form";
  content: any;
  order: number;
}

export interface FormSubmission {
  id: number;
  page_id: number;
  data: Record<string, any>;
  created_at: string;
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = localStorage.getItem("auth_token");

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Authentication
  async login(credentials: {
    username: string;
    password: string;
    tenant_id?: number;
  }) {
    // Super Admin Demo Login
    if (
      credentials.username === "superadmin" &&
      credentials.password === "superadmin123"
    ) {
      const demoResponse = {
        token: "demo_superadmin_token_" + Date.now(),
        user: {
          id: 999,
          username: "superadmin",
          email: "superadmin@system.local",
          role: "super_admin" as const,
          created_at: new Date().toISOString(),
        },
      };

      localStorage.setItem("auth_token", demoResponse.token);
      localStorage.setItem("demo_mode", "true");
      localStorage.setItem("user_type", "super_admin");
      return demoResponse;
    }

    // Tenant Admin Demo Login
    if (
      credentials.username === "admin" &&
      credentials.password === "admin123"
    ) {
      const demoResponse = {
        token: "demo_tenant_token_" + Date.now(),
        user: {
          id: 1,
          username: "admin",
          email: "admin@wws-strube.de",
          role: "tenant_admin" as const,
          tenant_id: 1,
          created_at: new Date().toISOString(),
          tenant: {
            id: 1,
            name: "WWS-Strube Demo",
            subdomain: "demo",
            settings: { timezone: "Europe/Berlin", language: "de" },
            branding: { primary_color: "#3b82f6", company_name: "WWS-Strube" },
          },
        },
      };

      localStorage.setItem("auth_token", demoResponse.token);
      localStorage.setItem("demo_mode", "true");
      localStorage.setItem("user_type", "tenant_admin");
      return demoResponse;
    }

    try {
      const response = await this.request<{ token: string; user: User }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify(credentials),
        },
      );

      localStorage.setItem("auth_token", response.token);
      localStorage.removeItem("demo_mode");
      localStorage.removeItem("user_type");
      return response;
    } catch (error) {
      // Fallback to demo mode if backend is not available
      if (
        credentials.username === "superadmin" &&
        credentials.password === "superadmin123"
      ) {
        const demoResponse = {
          token: "demo_superadmin_token_" + Date.now(),
          user: {
            id: 999,
            username: "superadmin",
            email: "superadmin@system.local",
            role: "super_admin" as const,
            created_at: new Date().toISOString(),
          },
        };

        localStorage.setItem("auth_token", demoResponse.token);
        localStorage.setItem("demo_mode", "true");
        localStorage.setItem("user_type", "super_admin");
        return demoResponse;
      }

      if (
        credentials.username === "admin" &&
        credentials.password === "admin123"
      ) {
        const demoResponse = {
          token: "demo_tenant_token_" + Date.now(),
          user: {
            id: 1,
            username: "admin",
            email: "admin@wws-strube.de",
            role: "tenant_admin" as const,
            tenant_id: 1,
            created_at: new Date().toISOString(),
          },
        };

        localStorage.setItem("auth_token", demoResponse.token);
        localStorage.setItem("demo_mode", "true");
        localStorage.setItem("user_type", "tenant_admin");
        return demoResponse;
      }

      throw error;
    }
  }

  async logout() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("demo_mode");
    localStorage.removeItem("user_type");

    if (localStorage.getItem("demo_mode") !== "true") {
      await this.request("/auth/logout", { method: "POST" });
    }
  }

  async getCurrentUser(): Promise<User> {
    if (localStorage.getItem("demo_mode") === "true") {
      const userType = localStorage.getItem("user_type");

      if (userType === "super_admin") {
        return {
          id: 999,
          username: "superadmin",
          email: "superadmin@system.local",
          role: "super_admin",
          created_at: new Date().toISOString(),
        };
      }

      // Default to tenant admin demo
      return {
        id: 1,
        username: "admin",
        email: "admin@wws-strube.de",
        role: "tenant_admin",
        tenant_id: 1,
        created_at: new Date().toISOString(),
        tenant: {
          id: 1,
          name: "WWS-Strube Demo",
          subdomain: "demo",
          settings: { timezone: "Europe/Berlin", language: "de" },
          branding: { primary_color: "#3b82f6", company_name: "WWS-Strube" },
        },
      };
    }

    return this.request<User>("/auth/me");
  }

  // Landing Pages
  async getPages(): Promise<LandingPage[]> {
    if (localStorage.getItem("demo_mode") === "true") {
      return [
        {
          id: 1,
          title: "Museumsmitarbeiter",
          slug: "museumsmitarbeiter",
          header_image: "",
          header_text: "Werden Sie Teil unseres Teams im Museum",
          header_overlay_color: "#000000",
          header_overlay_opacity: 0.5,
          header_height: 400,
          content_blocks: [
            {
              id: "1",
              type: "header",
              content: { text: "Ihre Aufgaben" },
              order: 1,
            },
            {
              id: "2",
              type: "list",
              content: {
                items: [
                  {
                    emoji: "🎨",
                    text: "Betreuung von Ausstellungen und Besuchern",
                  },
                  { emoji: "📚", text: "Pflege und Verwaltung von Sammlungen" },
                  { emoji: "👥", text: "Durchführung von Führungen" },
                  { emoji: "💼", text: "Administrative Tätigkeiten" },
                ],
              },
              order: 2,
            },
          ],
          status: "published",
          user_id: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
    }

    return this.request<LandingPage[]>("/pages");
  }

  async getPage(id: number): Promise<LandingPage> {
    return this.request<LandingPage>(`/pages/${id}`);
  }

  async getPageBySlug(slug: string): Promise<LandingPage> {
    return this.request<LandingPage>(`/pages/slug/${slug}`);
  }

  async createPage(page: Partial<LandingPage>): Promise<LandingPage> {
    return this.request<LandingPage>("/pages", {
      method: "POST",
      body: JSON.stringify(page),
    });
  }

  async updatePage(
    id: number,
    page: Partial<LandingPage>,
  ): Promise<LandingPage> {
    return this.request<LandingPage>(`/pages/${id}`, {
      method: "PUT",
      body: JSON.stringify(page),
    });
  }

  async deletePage(id: number): Promise<void> {
    await this.request(`/pages/${id}`, { method: "DELETE" });
  }

  // File Upload
  async uploadFile(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("auth_token");
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    return response.json();
  }

  async getGallery(): Promise<{
    files: Array<{
      name: string;
      url: string;
      size: number;
      created_at: string;
    }>;
  }> {
    return this.request<{
      files: Array<{
        name: string;
        url: string;
        size: number;
        created_at: string;
      }>;
    }>("/gallery");
  }

  // Form Submissions
  async getSubmissions(pageId?: number): Promise<FormSubmission[]> {
    if (localStorage.getItem("demo_mode") === "true") {
      // Return demo data - this will be handled in the component
      return [];
    }

    const endpoint = pageId ? `/submissions?page_id=${pageId}` : "/submissions";
    return this.request<FormSubmission[]>(endpoint);
  }

  async deleteSubmission(id: number): Promise<void> {
    if (localStorage.getItem("demo_mode") === "true") {
      // In demo mode, just return success
      return Promise.resolve();
    }

    await this.request(`/submissions/${id}`, { method: "DELETE" });
  }

  async submitForm(pageId: number, data: Record<string, any>): Promise<void> {
    await this.request("/submit", {
      method: "POST",
      body: JSON.stringify({ page_id: pageId, data }),
    });
  }

  // User Management
  async getUsers(): Promise<User[]> {
    if (localStorage.getItem("demo_mode") === "true") {
      return [
        {
          id: 1,
          username: "admin",
          email: "admin@wws-strube.de",
          role: "tenant_admin",
          created_at: new Date().toISOString(),
        },
      ];
    }

    return this.request<User[]>("/users");
  }

  async createUser(user: {
    username: string;
    email: string;
    password: string;
    role: string;
  }): Promise<User> {
    return this.request<User>("/users", {
      method: "POST",
      body: JSON.stringify(user),
    });
  }

  async updateUser(id: number, user: Partial<User>): Promise<User> {
    return this.request<User>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(user),
    });
  }

  async deleteUser(id: number): Promise<void> {
    await this.request(`/users/${id}`, { method: "DELETE" });
  }

  // Multi-Tenant Management (Super Admin only)
  async getSuperAdminTenants(): Promise<Tenant[]> {
    if (localStorage.getItem("demo_mode") === "true") {
      return [
        {
          id: 1,
          name: "WWS-Strube Demo",
          subdomain: "demo",
          status: "active",
          plan: "pro",
          max_users: 50,
          max_pages: 100,
          user_count: 2,
          page_count: 1,
          submission_count: 3,
          created_at: new Date().toISOString(),
          settings: { timezone: "Europe/Berlin", language: "de" },
          branding: { primary_color: "#3b82f6", company_name: "WWS-Strube" },
        },
        {
          id: 2,
          name: "Beispiel Firma GmbH",
          subdomain: "beispiel",
          status: "active",
          plan: "basic",
          max_users: 25,
          max_pages: 50,
          user_count: 5,
          page_count: 3,
          submission_count: 12,
          created_at: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          settings: { timezone: "Europe/Berlin", language: "de" },
          branding: {
            primary_color: "#10b981",
            company_name: "Beispiel Firma",
          },
        },
      ];
    }

    return this.request<Tenant[]>("/admin/tenants");
  }

  async getSuperAdminStats(): Promise<any> {
    if (localStorage.getItem("demo_mode") === "true") {
      return {
        total_tenants: 2,
        active_tenants: 2,
        total_users: 7,
        total_pages: 4,
        total_submissions: 15,
        plans: { basic: 1, pro: 1 },
        recent_tenants: [
          {
            id: 2,
            name: "Beispiel Firma GmbH",
            subdomain: "beispiel",
            status: "active",
            created_at: new Date(
              Date.now() - 7 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          },
          {
            id: 1,
            name: "WWS-Strube Demo",
            subdomain: "demo",
            status: "active",
            created_at: new Date(
              Date.now() - 30 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          },
        ],
      };
    }

    return this.request<any>("/admin/stats");
  }

  async createTenant(tenant: {
    name: string;
    subdomain: string;
    domain?: string;
    plan: string;
    admin_email: string;
    admin_password: string;
    admin_username: string;
  }): Promise<Tenant> {
    console.log("API: Creating tenant", tenant);

    if (localStorage.getItem("demo_mode") === "true") {
      console.log("API: Demo mode - creating tenant locally");
      const newTenant = {
        id: Math.floor(Math.random() * 1000) + 100,
        name: tenant.name,
        subdomain: tenant.subdomain,
        domain: tenant.domain,
        status: "active" as const,
        plan: tenant.plan as any,
        max_users: 50,
        max_pages: 100,
        user_count: 1,
        page_count: 0,
        submission_count: 0,
        created_at: new Date().toISOString(),
        settings: { timezone: "Europe/Berlin", language: "de" },
        branding: { primary_color: "#3b82f6", company_name: tenant.name },
      };

      console.log("API: Tenant created successfully", newTenant);
      return Promise.resolve(newTenant);
    }

    return this.request<Tenant>("/admin/tenants", {
      method: "POST",
      body: JSON.stringify(tenant),
    });
  }

  async updateTenant(id: number, tenant: Partial<Tenant>): Promise<Tenant> {
    return this.request<Tenant>(`/admin/tenants/${id}`, {
      method: "PUT",
      body: JSON.stringify(tenant),
    });
  }

  async deleteTenant(id: number): Promise<void> {
    if (localStorage.getItem("demo_mode") === "true") {
      return Promise.resolve();
    }

    await this.request(`/admin/tenants/${id}`, { method: "DELETE" });
  }

  async impersonateTenant(
    tenantId: number,
  ): Promise<{ token: string; tenant: any }> {
    if (localStorage.getItem("demo_mode") === "true") {
      // Switch to tenant admin demo mode
      const demoToken = "demo_tenant_impersonate_" + Date.now();
      localStorage.setItem("auth_token", demoToken);
      localStorage.setItem("user_type", "tenant_admin");

      return Promise.resolve({
        token: demoToken,
        tenant: {
          id: tenantId,
          name: "Demo Tenant",
          subdomain: "demo",
          settings: { timezone: "Europe/Berlin", language: "de" },
          branding: { primary_color: "#3b82f6", company_name: "Demo Tenant" },
        },
      });
    }

    return this.request<{ token: string; tenant: any }>(
      `/admin/tenants/${tenantId}/impersonate`,
      {
        method: "POST",
      },
    );
  }

  async stopImpersonation(): Promise<{ token: string }> {
    return this.request<{ token: string }>(
      "/admin/tenants/stop-impersonation",
      {
        method: "POST",
      },
    );
  }

  // Tenant Selection for Login
  async getAvailableTenants(): Promise<Tenant[]> {
    if (localStorage.getItem("demo_mode") === "true") {
      return [
        {
          id: 1,
          name: "WWS-Strube Demo",
          subdomain: "demo",
          status: "active",
          plan: "pro",
          max_users: 50,
          max_pages: 100,
          created_at: new Date().toISOString(),
          settings: {},
          branding: { primary_color: "#3b82f6", company_name: "WWS-Strube" },
        },
      ];
    }

    return this.request<Tenant[]>("/auth/tenants");
  }

  async switchTenant(
    tenantId: number,
  ): Promise<{ token: string; tenant: any }> {
    return this.request<{ token: string; tenant: any }>("/auth/switch-tenant", {
      method: "POST",
      body: JSON.stringify({ tenant_id: tenantId }),
    });
  }
}

export const api = new ApiClient();
