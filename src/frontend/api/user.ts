import { http } from "@/api/http";

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  avatar: string;
}

export interface UpdateProfileDto {
  name: string;
  avatar: string;
}

export interface UpdatePasswordDto {
  oldPassword: string;
  newPassword: string;
}

export function getUserProfile() {
  return http.get("user/profile").json<UserProfile>();
}

export function updateProfile(dto: UpdateProfileDto) {
  return http.put("user/profile", {
    json: dto,
  });
}

export function updatePassword(dto: UpdatePasswordDto) {
  return http.put("user/password", {
    json: dto,
  });
}
