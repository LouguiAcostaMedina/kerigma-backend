export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  churchId: string | null;
  phone: string | null;
  profileImage: string | null;
  isActive: boolean;
  isApproved: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
