// Import the functions you need from the SDKs you need
import { error } from "console";
import { initializeApp } from "firebase/app";
import { getDownloadURL, getStorage, getStream, ref, uploadBytesResumable } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDCFn8l9WqoKVvxMaKVS55Zjhv5aFQQI00",
  authDomain: "dionysus-d1fc2.firebaseapp.com",
  projectId: "dionysus-d1fc2",
  storageBucket: "dionysus-d1fc2.firebasestorage.app",
  messagingSenderId: "265067752095",
  appId: "1:265067752095:web:46aff7c84bc2d45919d0aa"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage  = getStorage(app);

export async function uploadFile(file: File, setProgress?: (progress: number) => void) {
    return new Promise ((resolve, reject) => {
        try {
            const storageRef = ref(storage, file.name)
            const uploadTask =  uploadBytesResumable(storageRef, file)

            uploadTask.on('state_changed', snapshot => {
                const progress  = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)

                if(setProgress) setProgress(progress);

                switch (snapshot.state) {
                    case 'paused':
                        console.log('upload is paused');  break;
                    case 'running':
                        console.log('upload is running'); break;
                }
            }, error => {
                reject(error)
            }, () => {
                getDownloadURL(uploadTask.snapshot.ref).then(downloadUrl => {
                    resolve(downloadUrl)
                })
            })
        } catch (error){
            console.error(error);
            reject(error);
        }
    })
}