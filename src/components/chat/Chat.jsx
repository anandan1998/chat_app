import { useEffect, useRef, useState } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import {arrayUnion,arrayRemove,doc, getDoc,onSnapshot, updateDoc,} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/upload";
import { format } from "timeago.js";
import { backStore } from "../../lib/backStore";
import { useLanguage } from "../../lib/LanguageContext";
import { translations } from "../../lib/translations";
import Joyride from 'react-joyride';

const Chat = ({ className }) => {
  const [chat, setChat] = useState();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [img, setImg] = useState({
    file: null,
    url: "",
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked, changeBlock } = useChatStore();

  const { chatlist, setChatlist } = backStore()

  const endRef = useRef(null);
  const audioRef = useRef(null);

  // Get the current language from the LanguageContext
  const { language } = useLanguage();
  const t = translations[language];

  const steps = [
    {
      target: '.info-icon', // Target the element with class 'info-icon'
      content: 'This is where you block or unblock the user.', // Tooltip content
    },
    {
      target: '.message-input',
      content: 'This is where you type your message.',
      placement: 'top',
    },
    {
      target: '.sendButton',
      content: 'Click here to send your message.',
      placement: 'top',
    },
  ];

  // Scroll to the end of the messages when the messages change
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  // Subscribe to the chat document and update the state
  useEffect(() => {
    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      setChat(res.data());
    });

    return () => {
      unSub();
    };
  }, [chatId]);

  // Handle typing indicator
  useEffect(() => {
    const typingTimeout = setTimeout(() => {
      setIsTyping(false);
      updateDoc(doc(db, "chats", chatId), {
        isTyping: { ...chat?.isTyping, [currentUser.id]: false },
      });
    }, 3000);

    return () => clearTimeout(typingTimeout);
  }, [text, chatId, chat?.isTyping, currentUser.id]);

  // Toggle dropdown for blocking user
  const toggleDropdown = () => setIsOpen(!isOpen);

  // Handle emoji selection
  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  };

  // Handle image selection
  const handleImg = (e) => {
    if (e.target.files[0]) {
      setImg({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  // Handle blocking/unblocking user
  const handleBlock = async () => {
    if (!user) return;

    const userDocRef = doc(db, "users", currentUser.id);

    try {
      await updateDoc(userDocRef, {
        blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id),
      });
      changeBlock();
    } catch (err) {
      console.log(err);
    }
  };

  // Handle sending message
  const handleSend = async () => {
    if (text === "") return;

    let imgUrl = null;

    try {
      if (img.file) {
        imgUrl = await upload(img.file);
      }

      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion({
          senderId: currentUser.id,
          text,
          createdAt: new Date(),
          ...(imgUrl && { img: imgUrl }),
        }),
        isTyping: { ...chat?.isTyping, [currentUser.id]: false },
      });

      const userIDs = [currentUser.id, user.id];

      userIDs.forEach(async (id) => {
        const userChatsRef = doc(db, "userchats", id);
        const userChatsSnapshot = await getDoc(userChatsRef);

        if (userChatsSnapshot.exists()) {
          const userChatsData = userChatsSnapshot.data();

          const chatIndex = userChatsData.chats.findIndex(
            (c) => c.chatId === chatId
          );

          userChatsData.chats[chatIndex].lastMessage = text;
          userChatsData.chats[chatIndex].isSeen =
            id === currentUser.id ? true : false;
          userChatsData.chats[chatIndex].updatedAt = Date.now();

          await updateDoc(userChatsRef, {
            chats: userChatsData.chats,
          });
          audioRef.current.play();
        }
      });
    } catch (err) {
      console.log(err);
    } finally {
      setImg({
        file: null,
        url: "",
      });

      setText("");
    }
  };

  // Handle typing status
  const handleTyping = async (isTyping) => {
    setIsTyping(isTyping);
    await updateDoc(doc(db, "chats", chatId), {
      isTyping: { ...chat?.isTyping, [currentUser.id]: isTyping },
    });
  };

  return (
    <div className={`chat ${className}`}>
      <Joyride
      steps={steps}
      continuous
      showProgress
      showSkipButton
      />
      <div className="top">
        <div className="user">
          <div className="back">
            <img src="./back.png" alt="" onClick={() => setChatlist(true)} />
          </div>
          <img src={user?.avatar || "./avatar.png"} alt="" />
          <div className="texts">
            <h3>{user?.username}</h3>
            {chat?.isTyping &&
              Object.keys(chat.isTyping).some(
                (key) => chat.isTyping[key] && key !== currentUser.id
              ) && <p className="typing-indicator">typing...</p>
            }
          </div>
        </div>
        <div className="icons">
          {/* <img src="./phone.png" alt="" />
          <img src="./video.png" alt="" /> */}
          <img onClick={toggleDropdown} src="./info.png" alt="" className="info-icon" />
        </div>
        {isOpen && (
          <ul className="block-button" style={{ position: 'absolute', listStyleType: 'none', padding: 0 }}>
            <li><button onClick={handleBlock}>{isCurrentUserBlocked
              ? t.youAreBlocked
              : isReceiverBlocked
                ? t.userBlocked
                : t.blockUser}</button></li>
          </ul>
        )}
      </div>
      <div className="center">
        {chat?.messages?.map((message) => (
          <div
            className={
              message.senderId === currentUser?.id ? "message own" : "message"
            }
            key={message?.createdAt}
          >
            <div className="texts">
              {message.img && <img src={message.img} alt="" />}
              <p>{message.text}</p>
              <span>{format(message.createdAt.toDate())}</span>
            </div>
          </div>
        ))}
        {img.url && (
          <div className="message own">
            <div className="texts">
              <img src={img.url} alt="" />
            </div>
          </div>
        )}
        <div ref={endRef}></div>
      </div>
      <div className="bottom">
        <div className="icons">
          <label htmlFor="file">
            <img src="./img.png" alt="" />
          </label>
          <input
            type="file"
            id="file"
            style={{ display: "none" }}
            onChange={handleImg}
          />
          {/* <img src="./camera.png" alt="" />
          <img src="./mic.png" alt="" /> */}
        </div>
        <input
          type="text"
          placeholder={
            isCurrentUserBlocked || isReceiverBlocked
              ? t.cannotSendMessage
              : t.typeAMessage
          }
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            handleTyping(true);
          }}
          onBlur={() => handleTyping(false)}
          className="message-input"
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        />
        <div className="emoji">
          <img
            src="./emoji.png"
            alt=""
            onClick={() => setOpen((prev) => !prev)}
          />
          <div className="picker">
            <EmojiPicker open={open} onEmojiClick={handleEmoji} />
          </div>
        </div>
        <button
          className="sendButton"
          onClick={handleSend}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        >
          <audio ref={audioRef} src="./send.mp3" />
          {t.send}
        </button>
      </div>
    </div>
  );
};

export default Chat;

// import { useEffect, useRef, useState } from "react";
// import "./chat.css";
// import EmojiPicker from "emoji-picker-react";
// import {
//   arrayUnion,
//   arrayRemove,
//   doc,
//   getDoc,
//   onSnapshot,
//   updateDoc,
// } from "firebase/firestore";
// import { db } from "../../lib/firebase";
// import { useChatStore } from "../../lib/chatStore";
// import { useUserStore } from "../../lib/userStore";
// import upload from "../../lib/upload";
// import { format } from "timeago.js";

// const Chat = () => {
//   const [chat, setChat] = useState();
//   const [open, setOpen] = useState(false);
//   const [text, setText] = useState("");
//   const [img, setImg] = useState({
//     file: null,
//     url: "",
//   });
//   const [isOpen, setIsOpen] = useState(false);
//   const [isTyping, setIsTyping] = useState(false);

//   const { currentUser } = useUserStore();
//   const { chatId, user, isCurrentUserBlocked, isReceiverBlocked, changeBlock } =
//     useChatStore();

//   const endRef = useRef(null);
//   const audioRef = useRef(null);

//   useEffect(() => {
//     endRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [chat?.messages]);

//   useEffect(() => {
//     const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
//       setChat(res.data());
//     });

//     return () => {
//       unSub();
//     };
//   }, [chatId]);

//   useEffect(() => {
//     const typingTimeout = setTimeout(() => {
//       setIsTyping(false);
//       updateDoc(doc(db, "chats", chatId), {
//         isTyping: { ...chat?.isTyping, [currentUser.id]: false },
//       });
//     }, 3000);

//     return () => clearTimeout(typingTimeout);
//   }, [text, chatId, chat?.isTyping, currentUser.id]);

//   const toggleDropdown = () => setIsOpen(!isOpen);

//   const handleEmoji = (e) => {
//     setText((prev) => prev + e.emoji);
//     setOpen(false);
//   };

//   const handleImg = (e) => {
//     if (e.target.files[0]) {
//       setImg({
//         file: e.target.files[0],
//         url: URL.createObjectURL(e.target.files[0]),
//       });
//     }
//   };

//   const handleBlock = async () => {
//     if (!user) return;

//     const userDocRef = doc(db, "users", currentUser.id);

//     try {
//       await updateDoc(userDocRef, {
//         blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id),
//       });
//       changeBlock();
//     } catch (err) {
//       console.log(err);
//     }
//   };

//   const handleSend = async () => {
//     if (text === "") return;

//     let imgUrl = null;

//     try {
//       if (img.file) {
//         imgUrl = await upload(img.file);
//       }

//       await updateDoc(doc(db, "chats", chatId), {
//         messages: arrayUnion({
//           senderId: currentUser.id,
//           text,
//           createdAt: new Date(),
//           ...(imgUrl && { img: imgUrl }),
//         }),
//         isTyping: { ...chat?.isTyping, [currentUser.id]: false },
//       });

//       const userIDs = [currentUser.id, user.id];

//       userIDs.forEach(async (id) => {
//         const userChatsRef = doc(db, "userchats", id);
//         const userChatsSnapshot = await getDoc(userChatsRef);

//         if (userChatsSnapshot.exists()) {
//           const userChatsData = userChatsSnapshot.data();

//           const chatIndex = userChatsData.chats.findIndex(
//             (c) => c.chatId === chatId
//           );

//           userChatsData.chats[chatIndex].lastMessage = text;
//           userChatsData.chats[chatIndex].isSeen =
//             id === currentUser.id ? true : false;
//           userChatsData.chats[chatIndex].updatedAt = Date.now();

//           await updateDoc(userChatsRef, {
//             chats: userChatsData.chats,
//           });
//           audioRef.current.play();
//         }
//       });
//     } catch (err) {
//       console.log(err);
//     } finally {
//       setImg({
//         file: null,
//         url: "",
//       });

//       setText("");
//     }
//   };

//   const handleTyping = async (isTyping) => {
//     setIsTyping(isTyping);
//     await updateDoc(doc(db, "chats", chatId), {
//       isTyping: { ...chat?.isTyping, [currentUser.id]: isTyping },
//     });
//   };

//   return (
//     <div className="chat">
//       <div className="top">
//         <div className="user">
//           <img src={user?.avatar || "./avatar.png"} alt="" />
//           <div className="texts">
//             <span>{user?.username}</span>
//             <p>Lorem ipsum dolor, sit amet.</p>
//           </div>
//         </div>
//         <div className="icons">
//           {/* <img src="./phone.png" alt="" />
//           <img src="./video.png" alt="" /> */}
//           <img onClick={toggleDropdown} src="./info.png" alt="" />
//         </div>
//         {isOpen && (
//           <ul className="block-button" style={{ position: 'absolute', listStyleType: 'none', padding: 0 }}>
//             <li><button onClick={handleBlock}>{isCurrentUserBlocked
//               ? "You are Blocked!"
//               : isReceiverBlocked
//                 ? "User blocked"
//                 : "Block User"}</button></li>
//           </ul>
//         )}
//       </div>
//       <div className="center">
//         {chat?.messages?.map((message) => (
//           <div
//             className={
//               message.senderId === currentUser?.id ? "message own" : "message"
//             }
//             key={message?.createdAt}
//           >
//             <div className="texts">
//               {message.img && <img src={message.img} alt="" />}
//               <p>{message.text}</p>
//               <span>{format(message.createdAt.toDate())}</span>
//             </div>
//           </div>
//         ))}
//         {img.url && (
//           <div className="message own">
//             <div className="texts">
//               <img src={img.url} alt="" />
//             </div>
//           </div>
//         )}
//         {chat?.isTyping &&
//           Object.keys(chat.isTyping).some(
//             (key) => chat.isTyping[key] && key !== currentUser.id
//           ) && <p className="typing-indicator">typing...</p>}
//         <div ref={endRef}></div>
//       </div>
//       <div className="bottom">
//         <div className="icons">
//           <label htmlFor="file">
//             <img src="./img.png" alt="" />
//           </label>
//           <input
//             type="file"
//             id="file"
//             style={{ display: "none" }}
//             onChange={handleImg}
//           />
//           <img src="./camera.png" alt="" />
//           <img src="./mic.png" alt="" />
//         </div>
//         <input
//           type="text"
//           placeholder={
//             isCurrentUserBlocked || isReceiverBlocked
//               ? "You cannot send a message"
//               : "Type a message..."
//           }
//           value={text}
//           onChange={(e) => {
//             setText(e.target.value);
//             handleTyping(true);
//           }}
//           onBlur={() => handleTyping(false)}
//           disabled={isCurrentUserBlocked || isReceiverBlocked}
//         />
//         <div className="emoji">
//           <img
//             src="./emoji.png"
//             alt=""
//             onClick={() => setOpen((prev) => !prev)}
//           />
//           <div className="picker">
//             <EmojiPicker open={open} onEmojiClick={handleEmoji} />
//           </div>
//         </div>
//         <button
//           className="sendButton"
//           onClick={handleSend}
//           disabled={isCurrentUserBlocked || isReceiverBlocked}
//         >
//           <audio ref={audioRef} src="./send.mp3" />
//           Send
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Chat;

// intial working version
// import { useEffect, useRef, useState } from "react";
// import "./chat.css";
// import EmojiPicker from "emoji-picker-react";
// import {
//   arrayUnion,
//   arrayRemove,
//   doc,
//   getDoc,
//   onSnapshot,
//   updateDoc,
// } from "firebase/firestore";
// import { db } from "../../lib/firebase";
// import { useChatStore } from "../../lib/chatStore";
// import { useUserStore } from "../../lib/userStore";
// import upload from "../../lib/upload";
// import { format } from "timeago.js";

// const Chat = () => {
//   const [chat, setChat] = useState();
//   const [open, setOpen] = useState(false);
//   const [text, setText] = useState("");
//   const [img, setImg] = useState({
//     file: null,
//     url: "",
//   });
//   const [isOpen, setIsOpen] = useState(false);

//   const { currentUser } = useUserStore();
//   const { chatId, user, isCurrentUserBlocked, isReceiverBlocked, changeBlock } =
//     useChatStore();

//   const endRef = useRef(null);
//   const audioRef = useRef(null);

//   useEffect(() => {
//     endRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [chat?.messages]);

//   useEffect(() => {
//     const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
//       setChat(res.data());
//     });

//     return () => {
//       unSub();
//     };
//   }, [chatId]);

//   const toggleDropdown = () => setIsOpen(!isOpen);

//   const handleEmoji = (e) => {
//     setText((prev) => prev + e.emoji);
//     setOpen(false);
//   };

//   const handleImg = (e) => {
//     if (e.target.files[0]) {
//       setImg({
//         file: e.target.files[0],
//         url: URL.createObjectURL(e.target.files[0]),
//       });
//     }
//   };

//   const handleBlock = async () => {
//     if (!user) return;

//     const userDocRef = doc(db, "users", currentUser.id);

//     try {
//       await updateDoc(userDocRef, {
//         blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id),
//       });
//       changeBlock();
//     } catch (err) {
//       console.log(err);
//     }
//   };

//   const handleSend = async () => {
//     if (text === "") return;

//     let imgUrl = null;

//     try {
//       if (img.file) {
//         imgUrl = await upload(img.file);
//       }

//       await updateDoc(doc(db, "chats", chatId), {
//         messages: arrayUnion({
//           senderId: currentUser.id,
//           text,
//           createdAt: new Date(),
//           ...(imgUrl && { img: imgUrl }),
//         }),
//       });

//       const userIDs = [currentUser.id, user.id];

//       userIDs.forEach(async (id) => {
//         const userChatsRef = doc(db, "userchats", id);
//         const userChatsSnapshot = await getDoc(userChatsRef);

//         if (userChatsSnapshot.exists()) {
//           const userChatsData = userChatsSnapshot.data();

//           const chatIndex = userChatsData.chats.findIndex(
//             (c) => c.chatId === chatId
//           );

//           userChatsData.chats[chatIndex].lastMessage = text;
//           userChatsData.chats[chatIndex].isSeen =
//             id === currentUser.id ? true : false;
//           userChatsData.chats[chatIndex].updatedAt = Date.now();

//           await updateDoc(userChatsRef, {
//             chats: userChatsData.chats,
//           });
//           audioRef.current.play();
//         }
//       });
//     } catch (err) {
//       console.log(err);
//     } finally{
//     setImg({
//       file: null,
//       url: "",
//     });

//     setText("");
//     }
//   };

//   return (
//     <div className="chat">
//       <div className="top">
//         <div className="user">
//           <img src={user?.avatar || "./avatar.png"} alt="" />
//           <div className="texts">
//             <span>{user?.username}</span>
//             <p>Lorem ipsum dolor, sit amet.</p>
//           </div>
//         </div>
//         <div className="icons">
//           {/* <img src="./phone.png" alt="" />
//           <img src="./video.png" alt="" /> */}
//           <img onClick={toggleDropdown} src="./info.png" alt="" />
//         </div>
//         {isOpen && (
//             <ul className="block-button" style={{ position: 'absolute', listStyleType: 'none', padding: 0 }}>
//                 <li><button onClick={handleBlock}>{isCurrentUserBlocked
//             ? "You are Blocked!"
//             : isReceiverBlocked
//             ? "User blocked"
//             : "Block User"}</button></li>
//             </ul>
//         )}
//       </div>
//       <div className="center">
//         {chat?.messages?.map((message) => (
//           <div
//             className={
//               message.senderId === currentUser?.id ? "message own" : "message"
//             }
//             key={message?.createAt}
//           >
//             <div className="texts">
//               {message.img && <img src={message.img} alt="" />}
//               <p>{message.text}</p>
//               <span>{format(message.createdAt.toDate())}</span>
//             </div>
//           </div>
//         ))}
//         {img.url && (
//           <div className="message own">
//             <div className="texts">
//               <img src={img.url} alt="" />
//             </div>
//           </div>
//         )}
//         <div ref={endRef}></div>
//       </div>
//       <div className="bottom">
//         <div className="icons">
//           <label htmlFor="file">
//             <img src="./img.png" alt="" />
//           </label>
//           <input
//             type="file"
//             id="file"
//             style={{ display: "none" }}
//             onChange={handleImg}
//           />
//           <img src="./camera.png" alt="" />
//           <img src="./mic.png" alt="" />
//         </div>
//         <input
//           type="text"
//           placeholder={
//             isCurrentUserBlocked || isReceiverBlocked
//               ? "You cannot send a message"
//               : "Type a message..."
//           }
//           value={text}
//           onChange={(e) => setText(e.target.value)}
//           disabled={isCurrentUserBlocked || isReceiverBlocked}
//         />
//         <div className="emoji">
//           <img
//             src="./emoji.png"
//             alt=""
//             onClick={() => setOpen((prev) => !prev)}
//           />
//           <div className="picker">
//             <EmojiPicker open={open} onEmojiClick={handleEmoji} />
//           </div>
//         </div>
//         <button
//           className="sendButton"
//           onClick={handleSend}
//           disabled={isCurrentUserBlocked || isReceiverBlocked}
//         >
//         <audio ref={audioRef} src="./send.mp3" />
//           Send
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Chat;
