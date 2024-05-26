import { useState } from "react";
import "./login.css";
import { toast } from "react-toastify";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import upload from "../../lib/upload";
import { useLanguage } from "../../lib/LanguageContext";
import { translations } from "../../lib/translations";
import Joyride from "react-joyride";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [avatar, setAvatar] = useState({
    file: null,
    url: "",
  });
  const [loading, setLoading] = useState(false);
  const { language, setLanguage } = useLanguage();
  const t = translations[language];
  const [runTour, setRunTour] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);
  const [showCongratsMessage, setShowCongratsMessage] = useState(false);
  const navigate = useNavigate();

  const handleAvatar = (e) => {
    if (e.target.files[0]) {
      setAvatar({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const { username, email, password } = Object.fromEntries(formData);

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const imgUrl = await upload(avatar.file);

      await setDoc(doc(db, "users", res.user.uid), {
        username,
        email,
        avatar: imgUrl,
        id: res.user.uid,
        blocked: [],
      });

      await setDoc(doc(db, "userchats", res.user.uid), {
        chats: [],
      });

      toast.success("Account created! You can login now!");
      setShowCongratsMessage(true);
      setTimeout(() => {
        setShowCongratsMessage(false);
      }, 5000);
    } catch (err) {
      console.log(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const { email, password } = Object.fromEntries(formData);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setShowAnimation(true);
      setTimeout(() => {
        navigate("/chat");
      }, 5000);
    } catch (err) {
      console.log(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      target: ".login-upload",
      content: "Upload an image for your profile.",
    },
    {
      target: ".login-username",
      content: "Enter a username for your new account.",
    },
    {
      target: ".login-email",
      content: "Enter your email here to sign up.",
    },
    {
      target: ".login-password",
      content: "Enter your password here.",
    },
    {
      target: ".login-sign-up",
      content: "Click here to sign up if you don't have an account.",
    },
    {
      target: ".login-email-existing",
      content: "Enter your email here to sign in or sign up.",
    },
    {
      target: ".login-password-existing",
      content: "Enter your password here.",
    },
    {
      target: ".login-sign-in",
      content: "Click here to sign in if you already have an account.",
    },
  ];

  return (
    <div className="login">
      <Joyride steps={steps} run={runTour} continuous showProgress showSkipButton />
      <div className="language-selector">
        <select onChange={(e) => setLanguage(e.target.value)} value={language}>
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="sv">Swedish</option>
        </select>
      </div>
      <div className={`rocket ${showAnimation ? 'show' : ''}`}></div>
      {showCongratsMessage && (
        <div className="congrats-message show">Your account is created. You can sign in now!</div>
      )}
      <div className={`item ${showAnimation ? 'hidden' : ''}`}>
        <h2>{t.welcomeBack}</h2>
        <form onSubmit={handleLogin}>
          <input type="text" className="login-email-existing" placeholder={t.email} name="email" data-tip="Enter your email address" />
          <input type="password" className="login-password-existing" placeholder={t.password} name="password" data-tip="Enter your password" />
          <button className="login-sign-in" disabled={loading} data-tip="Click to sign in">{loading ? t.loading : t.signIn}</button>
        </form>
      </div>
      <div className={`separator ${showAnimation ? 'hidden' : ''}`}></div>
      <div className={`item ${showAnimation ? 'hidden' : ''}`}>
        <h2>{t.createAccount}</h2>
        <form onSubmit={handleRegister}>
          <label htmlFor="file" className="login-upload" data-tip="Upload your avatar">
            <img src={avatar.url || "./avatar.png"} alt="" />
            {t.uploadImage}
          </label>
          <input
            type="file"
            id="file"
            style={{ display: "none" }}
            onChange={handleAvatar}
          />
          <input type="text" className="login-username" placeholder={t.username} name="username" data-tip="Enter your username" />
          <input type="text" className="login-email" placeholder={t.email} name="email" data-tip="Enter your email address" />
          <input type="password" className="login-password" placeholder={t.password} name="password" data-tip="Enter your password" />
          <button className="login-sign-up" disabled={loading} data-tip="Click to sign up">{loading ? t.loading : t.signUp}</button>
        </form>
      </div>
    </div>
  );
};

export default Login;







// import { useState } from "react";
// import "./login.css";
// import { toast } from "react-toastify";
// import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
// import { auth, db } from "../../lib/firebase";
// import { doc, setDoc } from "firebase/firestore";
// import upload from "../../lib/upload";
// import { translations } from "../../lib/translations";

// const Login = () => {
//   const [avatar, setAvatar] = useState({ file: null, url: "" });
//   const [loading, setLoading] = useState(false);
//   const [language, setLanguage] = useState("en");

//   const t = translations[language];

//   const handleAvatar = (e) => {
//     if (e.target.files[0]) {
//       setAvatar({ file: e.target.files[0], url: URL.createObjectURL(e.target.files[0]) });
//     }
//   };

//   const handleRegister = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     const formData = new FormData(e.target);
//     const { username, email, password } = Object.fromEntries(formData);

//     try {
//       const res = await createUserWithEmailAndPassword(auth, email, password);
//       const imgUrl = await upload(avatar.file);
//       await setDoc(doc(db, "users", res.user.uid), {
//         username,
//         email,
//         avatar: imgUrl,
//         id: res.user.uid,
//         blocked: [],
//       });
//       await setDoc(doc(db, "userchats", res.user.uid), {
//         chats: [],
//       });
//       toast.success("Account created! You can login now!");
//     } catch (err) {
//       console.log(err);
//       toast.error(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     const formData = new FormData(e.target);
//     const { email, password } = Object.fromEntries(formData);

//     try {
//       await signInWithEmailAndPassword(auth, email, password);
//     } catch (err) {
//       console.log(err);
//       toast.error(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="login">
//       <div className="language-selector">
//         <select onChange={(e) => setLanguage(e.target.value)} value={language}>
//           <option value="en">English</option>
//           <option value="hi">Hindi</option>
//           <option value="sv">Swedish</option>
//         </select>
//       </div>
//       <div className="item">
//         <h2>{t.welcomeBack}</h2>
//         <form onSubmit={handleLogin}>
//           <input type="text" placeholder={t.email} name="email" />
//           <input type="password" placeholder={t.password} name="password" />
//           <button disabled={loading}>{loading ? t.loading : t.signIn}</button>
//         </form>
//       </div>
//       <div className="separator"></div>
//       <div className="item">
//         <h2>{t.createAccount}</h2>
//         <form onSubmit={handleRegister}>
//           <label htmlFor="file">
//             <img src={avatar.url || "./avatar.png"} alt="" />
//             {t.uploadImage}
//           </label>
//           <input type="file" id="file" style={{ display: "none" }} onChange={handleAvatar} />
//           <input type="text" placeholder={t.username} name="username" />
//           <input type="text" placeholder={t.email} name="email" />
//           <input type="password" placeholder={t.password} name="password" />
//           <button disabled={loading}>{loading ? t.loading : t.signUp}</button>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default Login;

//login intial
// import { useState } from "react";
// import "./login.css";
// import { toast } from "react-toastify";
// import {
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword,
// } from "firebase/auth";
// import { auth, db } from "../../lib/firebase";
// import { doc, setDoc } from "firebase/firestore";
// import upload from "../../lib/upload";

// const Login = () => {
//   const [avatar, setAvatar] = useState({
//     file: null,
//     url: "",
//   });

//   const [loading, setLoading] = useState(false);

//   const handleAvatar = (e) => {
//     if (e.target.files[0]) {
//       setAvatar({
//         file: e.target.files[0],
//         url: URL.createObjectURL(e.target.files[0]),
//       });
//     }
//   };

//   const handleRegister = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     const formData = new FormData(e.target);

//     const { username, email, password } = Object.fromEntries(formData);

//     // // VALIDATE INPUTS
//     // if (!username || !email || !password)
//     //   return toast.warn("Please enter inputs!");
//     // if (!avatar.file) return toast.warn("Please upload an avatar!");

//     // // VALIDATE UNIQUE USERNAME
//     // const usersRef = collection(db, "users");
//     // const q = query(usersRef, where("username", "==", username));
//     // const querySnapshot = await getDocs(q);
//     // if (!querySnapshot.empty) {
//     //   return toast.warn("Select another username");
//     // }

//     try {
//       const res = await createUserWithEmailAndPassword(auth, email, password);

//       const imgUrl = await upload(avatar.file);

//       await setDoc(doc(db, "users", res.user.uid), {
//         username,
//         email,
//         avatar: imgUrl,
//         id: res.user.uid,
//         blocked: [],
//       });

//       await setDoc(doc(db, "userchats", res.user.uid), {
//         chats: [],
//       });

//       toast.success("Account created! You can login now!");
//     } catch (err) {
//       console.log(err);
//       toast.error(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     const formData = new FormData(e.target);
//     const { email, password } = Object.fromEntries(formData);

//     try {
//       await signInWithEmailAndPassword(auth, email, password);
//     } catch (err) {
//       console.log(err);
//       toast.error(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="login">
//       <div className="item">
//         <h2>Welcome back,</h2>
//         <form onSubmit={handleLogin}>
//           <input type="text" placeholder="Email" name="email" />
//           <input type="password" placeholder="Password" name="password" />
//           <button disabled={loading}>{loading ? "Loading" : "Sign In"}</button>
//         </form>
//       </div>
//       <div className="separator"></div>
//       <div className="item">
//         <h2>Create an Account</h2>
//         <form onSubmit={handleRegister}>
//           <label htmlFor="file">
//             <img src={avatar.url || "./avatar.png"} alt="" />
//             Upload an image
//           </label>
//           <input
//             type="file"
//             id="file"
//             style={{ display: "none" }}
//             onChange={handleAvatar}
//           />
//           <input type="text" placeholder="Username" name="username" />
//           <input type="text" placeholder="Email" name="email" />
//           <input type="password" placeholder="Password" name="password" />
//           <button disabled={loading}>{loading ? "Loading" : "Sign Up"}</button>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default Login;
