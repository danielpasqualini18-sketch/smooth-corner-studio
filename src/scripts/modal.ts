/** Preserve focus and keep keyboard navigation inside an open modal. */
export function createModalController(modal: HTMLElement | null, closeButton: HTMLElement | null) {
  let trigger: HTMLElement | null = null;
  let previousOverflow = "";
  let inactive: Array<{ element: HTMLElement; inert: boolean }> = [];
  const open = () => {
    if (!modal || modal.classList.contains("visible")) return;
    trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inactive = [];
    let activeBranch: HTMLElement = modal;
    while (activeBranch.parentElement) {
      for (const sibling of activeBranch.parentElement.children) {
        if (sibling !== activeBranch && sibling instanceof HTMLElement) {
          inactive.push({ element: sibling, inert: sibling.inert });
          sibling.inert = true;
        }
      }
      if (activeBranch.parentElement === document.body) break;
      activeBranch = activeBranch.parentElement;
    }
    modal.inert = false;
    modal.classList.add("visible");
    modal.setAttribute("aria-hidden", "false");
    closeButton?.focus();
  };
  const close = () => {
    if (!modal || !modal.classList.contains("visible")) return;
    modal.classList.remove("visible");
    modal.setAttribute("aria-hidden", "true");
    modal.inert = true;
    for (const { element, inert } of inactive) element.inert = inert;
    inactive = [];
    document.body.style.overflow = previousOverflow;
    trigger?.focus();
  };
  modal?.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const controls = [...modal.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex="0"]')];
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  });
  return { open, close };
}
