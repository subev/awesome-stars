import { useNavigation } from "react-router";

export function NavProgress() {
  const navigation = useNavigation();
  if (navigation.state === "idle") return null;

  return (
    <div
      key={navigation.location.key}
      role="progressbar"
      aria-label="Loading page"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5"
    >
      <div className="nav-progress bg-accent h-full w-full" />
    </div>
  );
}
