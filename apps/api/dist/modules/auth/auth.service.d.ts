export declare const AuthService: {
    register(data: {
        email: string;
        password: string;
        name: string;
        organizationName: string;
    }): Promise<any>;
    login(email: string, password: string): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            role: import("@stokku/database").OrganizationRole;
            organizationId: string;
            organizationSlug: string;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    refresh(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("@stokku/database").OrganizationRole;
        phone: string | null;
        avatarUrl: string | null;
        organization: {
            id: string;
            name: string;
            slug: string;
            currency: string;
            timezone: string;
        };
    }>;
    updateProfile(userId: string, data: {
        name?: string;
        phone?: string;
        avatarUrl?: string;
    }): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("@stokku/database").OrganizationRole;
        phone: string | null;
        avatarUrl: string | null;
        organization: {
            id: string;
            name: string;
            slug: string;
            currency: string;
            timezone: string;
        };
    }>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    requestPasswordReset(email: string): Promise<{
        message: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
};
//# sourceMappingURL=auth.service.d.ts.map