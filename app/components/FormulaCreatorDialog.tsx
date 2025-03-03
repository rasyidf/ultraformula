"use client";

import { FormulaCreator } from "./FormulaCreator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

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
