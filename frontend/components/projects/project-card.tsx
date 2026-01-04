import Link from "next/link";
import { Project } from "@/types/models";
import TrashIcon from "@/components/ui/trash-icon";

interface ProjectCardProps {
  project: Project;
  onDelete: (projectId: string, projectName: string, e: React.MouseEvent) => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  return (
    <div className="relative bg-card border border-border rounded-lg hover:border-primary-500 transition-colors group">
      <Link href={`/dashboard/${project.id}`} className="block p-6">
        <div className="flex items-start justify-between mb-4 pr-8">
          <h3 className="text-xl font-semibold">{project.name}</h3>
          <span
            className={`px-2 py-1 text-xs rounded ${
              project.status === "active"
                ? "bg-primary-500/20 text-primary-500"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {project.status}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{project.category}</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {project.brand_count} brand{project.brand_count !== 1 ? "s" : ""}
          </span>
          <span className="text-muted-foreground">
            {new Date(project.created_at).toLocaleDateString()}
          </span>
        </div>
      </Link>
      <button
        onClick={(e) => onDelete(project.id, project.name, e)}
        className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-red-500 transition-all duration-200 z-10"
        title="Delete project"
      >
        <TrashIcon size={18} />
      </button>
    </div>
  );
}
