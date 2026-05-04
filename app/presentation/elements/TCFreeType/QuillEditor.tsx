import Quill from "quill";
import {
  ForwardedRef,
  forwardRef,
  RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import "./quill.css";

type TCFreeTypeProps = {
  readOnly?: boolean;
  defaultValue: string;
  onTextChange?: () => any;
  onSelectionChange?: () => any;
  toolbar: any[];
};

/****************************************
 * The TCFreeType editor component for contracts
 * @requires The accompanying css file
 * @example //The script tag in the root (shown below). Can also use 'https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.bubble.css'
  {
    rel: "stylesheet",
    href: "https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css"
  }
    @example //Set it up like this
     <TCFreeType
        ref={quillRef as RefObject<Quill>}
        defaultValue={"Add your notes here..."}
        onTextChange={() => setEdited(true)}
        toolbar={[
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline"],
          [
            { list: "ordered" },
            { list: "bullet" },
            { list: "check" },
          ],
          ["clean"],
        ]}
      />
 */
const TCFreeType = forwardRef(
  (
    {
      readOnly,
      defaultValue,
      onTextChange,
      onSelectionChange,
      toolbar,
    }: TCFreeTypeProps,
    ref: ForwardedRef<Quill>
  ) => {
    const containerRef = useRef<any>(undefined);
    const onTextChangeRef = useRef(onTextChange);
    const onSelectionChangeRef = useRef(onSelectionChange);

    useLayoutEffect(() => {
      onTextChangeRef.current = onTextChange;
      onSelectionChangeRef.current = onSelectionChange;
    });

    useEffect(() => {
      if (ref) (ref as RefObject<Quill>).current?.enable(!readOnly);
    }, [ref, readOnly]);

    useEffect(() => {
      const container = containerRef.current;
      const editorContainer = container.appendChild(
        container.ownerDocument.createElement("div")
      );
      const quill = new Quill(editorContainer, {
        theme: "snow",
        readOnly: readOnly,
        //debug: "info",
        modules: {
          toolbar: toolbar,
          history: {
            delay: 2000,
            maxStack: 200,
            userOnly: true,
          },
        },
        placeholder: defaultValue,
      });

      (ref as RefObject<Quill>).current = quill;

      quill.on(Quill.events.TEXT_CHANGE, (...args) => {
        onTextChangeRef.current?.();
      });
      quill.on(Quill.events.SELECTION_CHANGE, (...args) => {
        onSelectionChangeRef.current?.();
      });

      if (ref)
        return () => {
          /**@ts-ignore */
          ref.current = null;
          container.innerHTML = "";
        };
    }, [ref]);

    return (
      <div
        className={`${readOnly ? "readOnly" : "none"} fade-md`}
        ref={containerRef}
      ></div>
    );
  }
);

TCFreeType.displayName = "Editor";

export default TCFreeType;
