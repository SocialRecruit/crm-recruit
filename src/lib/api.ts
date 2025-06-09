const API_BASE_URL = "/api";

export interface User {
  id: number;
  username: string;
  email: string;
  role: "admin" | "user";
  created_at: string;
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
  async login(credentials: { username: string; password: string }) {
    const response = await this.request<{ token: string; user: User }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify(credentials),
      },
    );

    localStorage.setItem("auth_token", response.token);
    return response;
  }

  async logout() {
    localStorage.removeItem("auth_token");
    await this.request("/auth/logout", { method: "POST" });
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>("/auth/me");
  }

  // Landing Pages
  async getPages(): Promise<LandingPage[]> {
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
    const endpoint = pageId ? `/submissions?page_id=${pageId}` : "/submissions";
    return this.request<FormSubmission[]>(endpoint);
  }

  async submitForm(pageId: number, data: Record<string, any>): Promise<void> {
    await this.request("/submit", {
      method: "POST",
      body: JSON.stringify({ page_id: pageId, data }),
    });
  }

  // User Management
  async getUsers(): Promise<User[]> {
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
}

export const api = new ApiClient();
