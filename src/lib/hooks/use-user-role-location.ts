import { useSession } from "next-auth/react";

type CustomUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
  locationId?: string;
};

export function useUserRoleAndLocation() {
  const { data: session } = useSession();
  const user = session?.user as CustomUser | undefined;
  return {
    role: user?.role || "STAFF",
    locationId: user?.locationId || null,
    user,
  };
}
