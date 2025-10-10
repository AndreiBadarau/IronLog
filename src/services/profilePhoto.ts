import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { auth, db, storage } from '../config/firebaseConfig';

export async function pickAndUploadProfilePhoto(
    onProgress: (progress: number) => void
): Promise<string | null> {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
        console.log('Permission to access media library was denied');
        return null;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
    });
    if (res.canceled) {
        return null;
    }
    const asset = res.assets[0];

    const edited = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 512, height: 512 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    const resp = await fetch(edited.uri);
    const blob = await resp.blob();

    const uid = auth.currentUser?.uid;
    if (!uid) {
        console.log('No authenticated user found');
        return null;
    }

    const fileRef = ref(storage, `users/${uid}/avatar.jpg`);
    const task = uploadBytesResumable(fileRef, blob, { contentType: 'image/jpeg' });

    await new Promise<void>((resolve, reject) => {
        task.on('state_changed',
            (snapshot) => onProgress?.(snapshot.bytesTransferred / snapshot.totalBytes),
            reject,
            () => resolve()
        );
    });
    const downloadURL = await getDownloadURL(fileRef);

    await updateProfile(auth.currentUser!, { photoURL: downloadURL });
    await updateDoc(doc(db, 'users', uid), { photoURL: downloadURL });

    return downloadURL;
  }