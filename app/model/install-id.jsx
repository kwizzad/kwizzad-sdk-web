import { v4 as uuid } from 'node-uuid';


const KEY = 'KwizzadInstallId';

let installId;


export default function getInstallId() {
  if (localStorage) {
    installId = localStorage.getItem(KEY);
  }
  if (!installId) {
    installId = uuid();
    localStorage.setItem(KEY, installId);
  }
  return installId;
}
