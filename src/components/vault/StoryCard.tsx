import { MoreVertical, Pencil, Trash2, Copy, FolderInput, ImageIcon, Music, Video, Tag } from "lucide-react";
import { Story, Folder, gradeStory } from "@/hooks/use-stories";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GradientCard } from "@/components/ui/gradient-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Props {
  story: Story;
  folders: Folder[];
  onEdit: (s: Story) => void;
  onDelete: (s: Story) => void;
  onDuplicate: (s: Story) => void;
  onMoveFolder: (s: Story, folderId: string | null) => void;
}

const gradeColor: Record<string, string> = {
  A: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  B: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  C: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
  D: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
};

export function StoryCard({ story, folders, onEdit, onDelete, onDuplicate, onMoveFolder }: Props) {
  const grade = gradeStory(story);
  return (
    <GradientCard className="h-full">
      <div className="p-4 flex flex-col gap-3 h-full">
      {story.image_url && (
        <img src={story.image_url} alt="" className="rounded-xl aspect-video object-cover w-full" />
      )}

      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("text-xs font-bold border rounded-md px-1.5 py-0.5", gradeColor[grade])}>
              {grade}
            </span>
            {story.category && (
              <Badge variant="secondary" className="rounded-md text-xs">{story.category}</Badge>
            )}
            {story.is_public && <Badge className="rounded-md text-xs">Public</Badge>}
          </div>
          <h3 className="font-semibold truncate">{story.title}</h3>
          {story.body && (
            <p className="text-sm text-white/70 line-clamp-2 mt-1">{story.body}</p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-apple">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onEdit(story)}>
              <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(story)}>
              <Copy className="h-3.5 w-3.5 mr-2" /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FolderInput className="h-3.5 w-3.5 mr-2" /> Move to folder
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => onMoveFolder(story, null)}>No folder</DropdownMenuItem>
                <DropdownMenuSeparator />
                {folders.length === 0 && (
                  <DropdownMenuItem disabled>No folders yet</DropdownMenuItem>
                )}
                {folders.map((f) => (
                  <DropdownMenuItem key={f.id} onClick={() => onMoveFolder(story, f.id)}>
                    {f.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem onClick={() => onEdit(story)}>
              <Tag className="h-3.5 w-3.5 mr-2" /> Edit tags
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(story)}>
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {(story.tags?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-1">
          {story.tags!.slice(0, 4).map((t) => (
            <Badge key={t} variant="outline" className="rounded-md text-[10px]">{t}</Badge>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-white/60 mt-auto pt-1">
        {story.image_url && <ImageIcon className="h-3.5 w-3.5" />}
        {story.audio_url && <Music className="h-3.5 w-3.5" />}
        {story.video_url && <Video className="h-3.5 w-3.5" />}
        <span className="ml-auto">{new Date(story.updated_at).toLocaleDateString()}</span>
      </div>
      </div>
    </GradientCard>
  );
}
