import {
  useState,
  useEffect,
  useRef,
} from "react";
import type { SharedContextProps } from "~/data/CommonTypes";
import type { Message } from "~/data/CustomTypes";
import { useOutletContext } from "react-router";
import { Icon } from "./elements/Icon";
import { Carousel } from "./elements/Carousel";
import {
  fetchMessages,
  insertMessage,
  fetchJennaImages,
} from "~/database/Database";
import PopUpModal from "./elements/PopUpModal";
import { JennaImages } from "./JennaImages";

export interface HomeProps {}

export function Home({}: HomeProps) {
  const context:SharedContextProps = useOutletContext<SharedContextProps>();

  const [messageText, setMessageText] =
    useState("");
  const [fromName, setFromName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] =
    useState(false);
  const [messages, setMessages] = useState<
    Message[]
  >([]);
  const [jennaImages, setJennaImages] = useState<
    string[]
  >([]);

  useEffect(() => {
    fetchMessages()
      .then((data) =>
        setMessages(data as Message[]),
      )
      .catch(console.error);
    fetchJennaImages()
      .then(setJennaImages)
      .catch(console.error);
  }, []);

  async function handleSubmit() {
    if (!messageText.trim() || !fromName.trim())
      return;
    setLoading(true);
    try {
      const inserted = await insertMessage(
        messageText,
        fromName,
      );
      setMessages((prev) => [
        inserted as Message,
        ...prev,
      ]);
      setMessageText("");
      setFromName("");
      setShowModal(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PopUpModal
        active={showModal}
        onClose={() => setShowModal(false)}
        width={320}
        icon={{
          name: "heart",
          size: 48,
          color: "var(--accent)",
        }}
      >
        <h3 className="center mt-10">
          Thanks for leaving Jenna a message!
        </h3>
      </PopUpModal>
      <div
        className="w-100 col middle center "
        style={{
          minHeight: "80vh",
          position: "relative",
          zIndex: 10,
        }}
      >
        <Icon name="heart" size={50} color="var(--accent)" />
        <div
          className="m-10"
          style={{ position: "relative" }}
        >
          <h2 className="mb-20 center">
            Write a message to Jenna.
          </h2>
          <form
            onSubmit={(f) => {
              f.preventDefault();
              handleSubmit();
            }}
            className="w-100 col gap-10"
          >
            {context.inShrink || <div
              className="boxed col middle"
              style={{
                padding: "60px 20px",
                zIndex: -1,
                top: -90,
                left: -20,
                position: "absolute",
                width: "100%",
                height: "100%",
                opacity: 0.9,
                backdropFilter: "blur(10px)",
              }}
            />}
            <div
              className="mr-20"
              style={{ zIndex: 10 }}
            >
              <textarea
                className="outline-accent"
                style={{ minHeight: 250 }}
                placeholder="Your message..."
                value={messageText}
                onChange={(e) =>
                  setMessageText(e.target.value)
                }
              />
            </div>
            <div className="">
              <input
                placeholder="Your name"
                className="w-100 outline-accent mb-10"
                value={fromName}
                onChange={(e) =>
                  setFromName(e.target.value)
                }
              />
            </div>
            <button
              className="accent w-100 row middle center gap-5"
              type="submit"
              disabled={loading}
            >
              <Icon name="mail-open" />
              {loading ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
               {context.inShrink ||<JennaImages urls={jennaImages} />}

      </div>
      {messages.length > 0 && (
        <div className="m-10 pt-20 pb-20 col middle">
          <div className="w-100 ">
            <Carousel
              resistance={30000}
              interval={3}
              showDots={"start"}
              autoplay={true}
              centerFocused={true}
            >
              {messages.map((msg) => (
                <div className="col h-100">
                  <div
                    key={msg.id}
                    className="col gap-5 p-10 h-100 boxed outline-accent"
                    style={{
                      width: context.inShrink ? 300 : 450,
                    }}
                  >
                    <p>"{msg.message}"</p>
                    <h3>{msg.from_name}</h3>
                  </div>
                </div>
              ))}
            </Carousel>
          </div>
        </div>
      )}
    </div>
  );
}
