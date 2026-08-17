import{c as r}from"./index-C5Ey6i-P.js";/**
 * @license lucide-react v0.394.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=r("Upload",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"17 8 12 3 7 8",key:"t8dd8p"}],["line",{x1:"12",x2:"12",y1:"3",y2:"15",key:"widbto"}]]),d="ufiktey7",p="auction_preset";async function l(t){var e;const a=new FormData;a.append("file",t),a.append("upload_preset",p),a.append("folder","gvice/user_uploads");const o=await fetch(`https://api.cloudinary.com/v1_1/${d}/image/upload`,{method:"POST",body:a});if(!o.ok){const n=await o.json().catch(()=>({}));throw new Error(((e=n.error)==null?void 0:e.message)||"Failed to upload image to Cloudinary")}return(await o.json()).secure_url}export{c as U,l as u};
