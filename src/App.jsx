import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"; // Import required components from react-router-dom
import Chat from "./components/chat/Chat";
import List from "./components/list/List";
import Login from "./components/login/Login";
import Notification from "./components/notification/Notification";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import { useUserStore } from "./lib/userStore";
import { useChatStore } from "./lib/chatStore";
import { backStore } from "./lib/backStore";
import { LanguageProvider } from "./lib/LanguageContext"; // Ensure correct path and extension

const App = () => {
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();
  const { chatId } = useChatStore();
  const { chatlist, setChatlist } = backStore();

  useEffect(() => {
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
    console.log("good", chatlist);
  }, [chatlist]);

  if (isLoading) return <div className="loading">Loading...</div>;

  return (
    <LanguageProvider>
      <Router>
        <div className="container">
          <Routes>
            <Route path="/" element={currentUser ? <Navigate to="/chat" /> : <Login />} />
            <Route path="/chat" element={currentUser ? <ChatWrapper chatId={chatId} chatlist={chatlist} /> : <Navigate to="/" />} />
          </Routes>
          <Notification />
        </div>
      </Router>
    </LanguageProvider>
  );
};

const ChatWrapper = ({ chatId, chatlist }) => (
  <>
    <List className={!chatlist ? "hide" : ""} />
    {chatId && <Chat className={chatlist ? "hide" : ""} />}
  </>
);

export default App;


// import { useEffect } from "react";
// import Chat from "./components/chat/Chat";
// import Detail from "./components/detail/Detail";
// import List from "./components/list/List";
// import Login from "./components/login/Login";
// import Notification from "./components/notification/Notification";
// import { onAuthStateChanged } from "firebase/auth";
// import { auth } from "./lib/firebase";
// import { useUserStore } from "./lib/userStore";
// import { useChatStore } from "./lib/chatStore";

// const App = () => {
//   const { currentUser, isLoading, fetchUserInfo } = useUserStore();
//   const { chatId } = useChatStore();

//   useEffect(() => {
//     const unSub = onAuthStateChanged(auth, (user) => {
//       fetchUserInfo(user?.uid);
//     });

//     return () => {
//       unSub();
//     };
//   }, [fetchUserInfo]);

//   if (isLoading) return <div className="loading">Loading...</div>;

//   return (
//     <div className="container">
//     {/* console.log({currentUser}) */}
//       {currentUser ? (
//         <>
//           <List />
//           {chatId && <Chat />}
//           {/* {chatId && <Detail />} */}
//         </>
//       ) : (
//         <Login />
//       )}
//       <Notification />
//     </div>
    
//   );
  
// };

// export default App;
