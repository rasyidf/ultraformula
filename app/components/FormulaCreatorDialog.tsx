"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { FormulaCreator } from "./FormulaCreator";

interface FormulaCreatorDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FormulaCreatorDialog({ isOpen, onClose }: FormulaCreatorDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Formula</DialogTitle>
        </DialogHeader>
        <FormulaCreator onComplete={onClose} />
      </DialogContent>
    </Dialog>
  );
}
