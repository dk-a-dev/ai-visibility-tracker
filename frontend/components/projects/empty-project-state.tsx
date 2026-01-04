import Link from "next/link";

export function EmptyProjectState() {
  return (
    <div className="text-center py-16 bg-card border border-border rounded-lg">
      <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
      <p className="text-muted-foreground mb-6">
        Create your first project to start tracking
      </p>
      <Link
        href="/onboarding"
        className="inline-block px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-md transition-colors"
      >
        Create Project
      </Link>
    </div>
  );
}
