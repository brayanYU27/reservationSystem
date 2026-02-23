import * as React from "react"
import { ChevronDown } from "lucide-react"

interface AccordionContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
  type?: 'single' | 'multiple';
}

const AccordionContext = React.createContext<AccordionContextValue>({})

interface AccordionProps {
  type?: 'single' | 'multiple';
  collapsible?: boolean;
  className?: string;
  children: React.ReactNode;
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ type = 'single', collapsible, className = "", children, ...props }, ref) => {
    const [value, setValue] = React.useState<string>("");

    return (
      <AccordionContext.Provider value={{ value, onValueChange: setValue, type }}>
        <div ref={ref} className={className} {...props}>
          {children}
        </div>
      </AccordionContext.Provider>
    )
  }
)
Accordion.displayName = "Accordion"

interface AccordionItemProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value: itemValue, className = "", children, ...props }, ref) => {
    return (
      <div ref={ref} className={`border-b ${className}`} {...props}>
        {children}
      </div>
    )
  }
)
AccordionItem.displayName = "AccordionItem"

interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className = "", children, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
      <button
        ref={ref}
        type="button"
        className={`flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180 ${className}`}
        onClick={() => setIsOpen(!isOpen)}
        data-state={isOpen ? "open" : "closed"}
        {...props}
      >
        {children}
        <ChevronDown className="size-4 shrink-0 transition-transform duration-200" />
      </button>
    )
  }
)
AccordionTrigger.displayName = "AccordionTrigger"

interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className = "", children, ...props }, ref) => {
    const buttonRef = React.useRef<HTMLButtonElement | null>(null);
    const [isOpen, setIsOpen] = React.useState(false);

    React.useEffect(() => {
      const button = buttonRef.current?.parentElement?.querySelector('button');
      if (button) {
        const handleClick = () => {
          setIsOpen(button.getAttribute('data-state') === 'open');
        };
        button.addEventListener('click', handleClick);
        return () => button.removeEventListener('click', handleClick);
      }
    }, []);

    if (!isOpen) return null;

    return (
      <div
        ref={ref}
        className={`overflow-hidden text-sm transition-all ${className}`}
        {...props}
      >
        <div className="pb-4 pt-0">{children}</div>
      </div>
    )
  }
)
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
