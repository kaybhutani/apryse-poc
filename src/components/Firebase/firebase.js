import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: 'pdftron-sign-app.firebaseapp.com',
  databaseURL: 'https://pdftron-sign-app.firebaseio.com',
  projectId: 'pdftron-sign-app',
  storageBucket: 'pdftron-sign-app.appspot.com',
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

export const auth = firebase.auth();
export const firestore = firebase.firestore();
export const storage = firebase.storage();

const provider = new firebase.auth.GoogleAuthProvider();

export const signInWithGoogle = () => {
  auth.signInWithPopup(provider);
};

export const generateUserDocument = async (user, additionalData) => {
  if (!user) return;
  const userRef = firestore.doc(`users/${user.uid}`);
  const snapshot = await userRef.get();
  if (!snapshot.exists) {
    const { email, displayName, photoURL } = user;
    try {
      await userRef.set({
        displayName,
        email,
        photoURL,
        ...additionalData,
      });
    } catch (error) {
      console.error('Error creating user document', error);
    }
  }
  return getUserDocument(user.uid);
};

const getUserDocument = async uid => {
  if (!uid) return null;
  try {
    const userDocument = await firestore.doc(`users/${uid}`).get();
    return {
      uid,
      ...userDocument.data(),
    };
  } catch (error) {
    console.error('Error fetching user', error);
  }
};

export const addDocumentToSign = async (uid, email, docRef, emails) => {
  if (!uid) return;
  const signed = false;
  const xfdf = [];
  const signedBy = [];
  firestore
    .collection('documentsToSign')
    .add({
      uid,
      email,
      docRef,
      emails,
      xfdf,
      signedBy,
      signed,
    })
    .then(function (docRef) {
      console.log('Document written with ID: ', docRef.id);
    })
    .catch(function (error) {
      console.error('Error adding document: ', error);
    });
};

export const updateDocumentToSign = async (docId, email, xfdfSigned) => {
  const docRef = firestore.collection('documentsToSign').doc(docId);
  docRef
    .get()
    .then(async (doc) => {
      if (doc.exists) {
        const { signedBy, emails, xfdf } = doc.data();
        if (!signedBy.includes(email)) {
          const signedByArray = [...signedBy, email];
          await docRef.update({
            xfdf: [...xfdf, xfdfSigned],
            signedBy: signedByArray,
          });
          
          if (signedByArray.length === emails.length) {
            await docRef.update({
              signed: true,
            });
          }
        }
      } else {
        console.log('No such document!');
      }
    })
    .catch(function (error) {
      console.log('Error getting document:', error);
    });
};

export const searchForDocumentToSign = async email => {
  const documentsRef = firestore.collection('documentsToSign');
  const query = documentsRef.where('emails', 'array-contains', email);
  const docIds = [];
  await query
    .get()
    .then(function (querySnapshot) {
      querySnapshot.forEach(function (doc) {
        const { docRef, email } = doc.data();
        const docId = doc.id;
        docIds.push({ docRef, email, docId });
      });
    })
    .catch(function (error) {
      console.log('Error getting documents: ', error);
    });
  return docIds;
};