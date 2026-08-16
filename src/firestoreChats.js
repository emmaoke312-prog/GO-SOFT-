import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";

function messagesRef(uid) {
  return collection(db, "chats", uid, "messages");
}

export async function saveConversation(uid, conversation) {
  const ref = doc(db, "chats", uid, "messages", conversation.id);
  await setDoc(ref, {
    ...conversation,
    updatedAt: Date.now(),
  });
}

export async function deleteConversation(uid, conversationId) {
  const ref = doc(db, "chats", uid, "messages", conversationId);
  await deleteDoc(ref);
}

export async function loadAllConversations(uid) {
  const q = query(messagesRef(uid), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  const conversations = {};
  const order = [];
  snapshot.forEach((docSnap) => {
    conversations[docSnap.id] = docSnap.data();
    order.push(docSnap.id);
  });
  return { conversations, order };
}
