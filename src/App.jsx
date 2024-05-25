import { useEffect } from "react";
import Chat from "./components/chat/Chat";
import Detail from "./components/detail/Detail";
import List from "./components/list/List";
import Login from "./components/login/Login";
import Notification from "./components/notification/Notification";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import { useUserStore } from "./lib/userStore";
import { useChatStore } from "./lib/chatStore";
import { backStore } from "./lib/backStore";

const App = () => {
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();
  const { chatId } = useChatStore();
  const { chatlist, setChatlist } = backStore()

  useEffect(() => {
  // const { chatlist } = backStore();
  console.log(chatlist);
}, []); 

  useEffect(() => {
    const unSub = onAuthStateChanged(auth, (user) => {
      fetchUserInfo(user?.uid);
    });

    return () => {
      unSub();
    };
  }, [fetchUserInfo]);

  useEffect(() => {
    console.log("good",chatlist)
    
  }, [chatlist])

  if (isLoading) return <div className="loading">Loading...</div>;

  return (
    <div className="container">
    {/* console.log({currentUser}) */}
      {currentUser ? (
        <>
          <List className={!chatlist ? "hide": ""}/>
          {chatId && <Chat className={chatlist ? "hide": ""}/>}
          {/* {chatId && <Detail />} */}
        </>
      ) : (
        <Login />
      )}
      <Notification />
    </div>
    
  );
  
};

export default App;
