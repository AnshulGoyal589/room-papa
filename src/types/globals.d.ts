type Roles = "admin" | "manager" | "customer";

interface UserPublicMetadata {
  role?: Roles;
}
