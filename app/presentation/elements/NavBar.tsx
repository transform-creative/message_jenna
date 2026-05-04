import type { SharedContextProps } from '~/data/CommonTypes';
import { CONTACT } from '~/data/Objects';
import { supabaseSignOut } from '~/database/Auth';

export interface NavBarProps {
context: SharedContextProps;
}

/******************************
 * NavBar component
 * @todo Create description
 */
export function NavBar ({context}:NavBarProps)  {
  /*********************************
   * Sign the user out
   */
  async function handleSignOut() {
    try {
      await supabaseSignOut();
      context.popAlert("Signed out!");
    } catch (error) {
      context.popAlert(
        "An error occurred signing you out!",
        `Contact ${CONTACT.devEmail} for support`,
        true
      );
    }
  }
  return (
   <div className="middle center">
        <div className="p-10 m-10 row boxed outline between middle w-100">
          <div className="row middle">
            <h4>Custom Transform React App</h4>
          </div>
          <div className="row middle">
            {context.session ? (
              <div className='row middle'>
                <p className='mr-10 boxed p-10'>{context.session.user.email}</p>
                  <button className="p-10" onClick={() => handleSignOut()}>
                    Sign out
                  </button>
              </div>
            ) : (
              <button className="p-10" onClick={() => context.navigate("/")}>
                Not signed in
              </button>
            )}
          </div>
        </div>
      </div>
  )
};