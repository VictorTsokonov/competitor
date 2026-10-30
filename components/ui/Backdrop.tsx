export default function Backdrop({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      aria-label="Close panel"
      onClick={onClose}
      className="absolute inset-0 z-40 cursor-default bg-ink/45"
    />
  );
}
