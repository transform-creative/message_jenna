import type { SharedContextProps } from "~/data/CommonTypes";
import { useOutletContext } from "react-router";
import { Icon } from "./elements/Icon";

export interface HomeProps {}

/******************************
 * home component
 * @todo Create description
 */
export function Home({}: HomeProps) {
  const context: SharedContextProps =
    useOutletContext();

  return (
    <div
      className="w-100 col middle center"
      style={{ minHeight: "100vh" }}
    >
                <Icon name="heart" size={50}/>

      <div className="m-10">
        <h2 className="mb-20 center">
          Write a message to Jenna.
        </h2>

        <div className="w-100 col gap-10">
          <div className="mr-20">
            <textarea
              className="outline-accent"
              style={{ minHeight: 250 }}
              placeholder="Your message..."
            />
          </div>
          <div className="">
            <input
              placeholder="Your name"
              className="w-100 outline-accent mb-10"
            />
          </div>
          <button className="accent w-100 row middle center gap-5">
            <Icon name="mail-open" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
