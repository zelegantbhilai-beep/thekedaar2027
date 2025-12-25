
// Neon Database Configuration and API Endpoints

export const NEON_DB_CONFIG = {
  url: "https://ep-cold-brook-aevce60i.apirest.c-2.us-east-2.aws.neon.tech/neondb/rest/v1",
  region: "us-east-2",
  provider: "aws"
};

// Unified API Base URL
// Using relative path ensures it works on Vercel deployment (same origin) and via proxy locally.
export const API_BASE_URL = "/api/v1";

export const ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
  },
  ADMIN: {
    WORKERS: `${API_BASE_URL}/admin/workers`,
    SERVICES: `${API_BASE_URL}/admin/services`,
    USERS: `${API_BASE_URL}/admin/users`,
    API_KEYS: `${API_BASE_URL}/admin/api-keys`,
  },
  PARTNER: {
    LEADS: `${API_BASE_URL}/partner/leads`,
    SCHEDULE: `${API_BASE_URL}/partner/schedule`,
    PROFILE: `${API_BASE_URL}/partner/profile`,
  },
  CONSUMER: {
    SEARCH: `${API_BASE_URL}/consumer/search`,
    BOOKINGS: `${API_BASE_URL}/consumer/bookings`,
    FEEDBACK: `${API_BASE_URL}/consumer/feedback`,
  }
};
