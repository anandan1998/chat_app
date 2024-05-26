import "./userInfo.css"
import { useUserStore } from "../../../lib/userStore";
import { useChatStore } from "../../../lib/chatStore";
import { auth } from "../../../lib/firebase";
import { useState } from "react";
import { useLanguage } from "../../../lib/LanguageContext";
import { translations } from "../../../lib/translations";
const Userinfo = () => {

  const [isOpen, setIsOpen] = useState(false);


  const {resetChat } = useChatStore();
  const { currentUser } = useUserStore();
  const { language } = useLanguage(); // Only consume the language here
  const t = translations[language];

  const handleLogout = () => {
    auth.signOut();
    resetChat()
  };

  const toggleDropdown = () => setIsOpen(!isOpen);

  return (
    <div className='userInfo'>
      <div className="user">
        <img src={currentUser.avatar || "./avatar.png"} alt="" />
        <h2>{currentUser.username}</h2>
      </div>
      <div className="icons">
        <img onClick={toggleDropdown} src="./more.png" alt="" />
      </div>
      {isOpen && (
            <ul className="logout-button" style={{ position: 'absolute', listStyleType: 'none', padding: 0 }}>
                <li><button onClick={handleLogout}>{t.logout}</button></li>
            </ul>
        )}
    </div>
  )
}

export default Userinfo