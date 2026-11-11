//@ts-nocheck
import { Story, Comment } from "../types";
import { StoryDetailPanel } from "./StoryDetailPanel";
import { motion } from "motion/react";

interface StoryModalProps {
  story: Story;
  comments: Comment[];
  onClose: () => void;
  onUpdateStory: (id: string, updates: Partial<Story>) => void;
  onAddComment: (storyId: string, text: string) => void;
}

export function StoryModal({
  story,
  comments = [],
  onClose,
  onUpdateStory,
  onAddComment,
}: StoryModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 dark:bg-slate-950/70 backdrop-blur-sm font-sans animate-fade-in"
      id="story-modal-overlay"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="w-full max-w-3xl max-h-[90vh] flex flex-col"
        id="story-modal-container"
      >
        <StoryDetailPanel
          story={story}
          comments={comments}
          onClose={onClose}
          onUpdateStory={onUpdateStory}
          onAddComment={onAddComment}
        />
      </motion.div>
    </div>
  );
}
