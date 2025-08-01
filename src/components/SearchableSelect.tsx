// // src/components/ui/SearchableSelect.tsx
// import React, { useState, useRef, useEffect } from "react";
// import { ChevronDown } from "lucide-react";

// export interface Option {
//   value: string;
//   label: string;
// }

// interface SearchableSelectProps {
//   options: Option[];
//   value: string;
//   onChange: (value: string) => void;
//   placeholder?: string;
//   disabled?: boolean;
//   className?: string;
// }

// const SearchableSelect: React.FC<SearchableSelectProps> = ({
//   options,
//   value,
//   onChange,
//   placeholder = "Select…",
//   disabled = false,
//   className = "",
// }) => {
//   const [open, setOpen] = useState(false);
//   const [filter, setFilter] = useState("");
//   const containerRef = useRef<HTMLDivElement>(null);

//   // close on outside click
//   useEffect(() => {
//     function clickOutside(e: MouseEvent) {
//       if (
//         containerRef.current &&
//         !containerRef.current.contains(e.target as Node)
//       ) {
//         setOpen(false);
//       }
//     }
//     document.addEventListener("mousedown", clickOutside);
//     return () => document.removeEventListener("mousedown", clickOutside);
//   }, []);

//   // filter options
//   const filtered = (options || []).filter((option) =>
//   typeof option === "string" &&
//   option.toLowerCase().includes((searchTerm || "").toLowerCase())
// );



//   // find current label
//   const currentLabel =
//     options.find(o => o.value === value)?.label || placeholder;

//   return (
//     <div
//       ref={containerRef}
//       className={`relative inline-block text-left ${className}`}
//     >
//       <button
//         type="button"
//         disabled={disabled}
//         onClick={() => setOpen(o => !o)}
//         className={`
//           w-full flex justify-between items-center border rounded px-3 py-2
//           ${disabled ? "bg-gray-100 cursor-not-allowed" : "hover:border-gray-400"}
//         `}
//       >
//         <span className={`${value ? "" : "text-gray-400"}`}>
//           {currentLabel}
//         </span>
//         <ChevronDown size={16} className="text-gray-500" />
//       </button>

//       {open && (
//         <div
//           className="absolute mt-1 w-full bg-white border rounded shadow-lg z-50"
//           style={{ maxHeight: 240 }}
//         >
//           <input
//             type="text"
//             autoFocus
//             value={filter}
//             onChange={e => setFilter(e.target.value)}
//             placeholder="Search..."
//             className="w-full border-b px-3 py-2 focus:outline-none"
//           />
//           <ul className="max-h-48 overflow-auto">
//             {filtered.map(o => (
//               <li
//                 key={o.value}
//                 onClick={() => {
//                   onChange(o.value);
//                   setOpen(false);
//                   setFilter("");
//                 }}
//                 className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
//               >
//                 {o.label}
//               </li>
//             ))}
//             {filtered.length === 0 && (
//               <li className="px-3 py-2 text-gray-500">No results</li>
//             )}
//           </ul>
//         </div>
//       )}
//     </div>
//   );
// };

// export default SearchableSelect;
