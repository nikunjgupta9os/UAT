import React, { useEffect, useState } from "react";
import axios from "axios";
import CustomSelect from "../../common/SearchSelect";
import SectionCard from "./SectionCard";


interface TreeNodeData {
  entity_id: string;
  entity_name: string;
  parentname: string | null;
  is_top_level_entity: boolean;
  level: string | null;
}

type TreeNodeType = {
  id: string;
  name: string;
  data: TreeNodeData;
  children?: TreeNodeType[];
};

type Option = { label: string; value: string };

// Now storing entity names instead of IDs
type EntityState = {
  buEntity0: string | null;
  buEntity1: string | null;
  buEntity2: string | null;
  buEntity3: string | null;
};

interface EntityDropdownProps {
  entityState: EntityState;
  isThere?: boolean; // Optional prop to control if the component is in a "view" mode
  setEntityState: React.Dispatch<React.SetStateAction<EntityState>>;
}

const ENTITY_LEVELS = ["buEntity0", "buEntity1", "buEntity2", "buEntity3"] as const;

const API_URL = "https://backend-slqi.onrender.com/api/entity/hierarchy";

// Flatten the tree and build map of id -> info
function flattenTree(
  nodes: TreeNodeType[],
  levelIndex = 0,
  parentChain: string[] = [],
  map = new Map<string, { levelIndex: number; parentChain: string[]; node: TreeNodeType }>()
) {
  for (const node of nodes) {
    map.set(node.id, { levelIndex, parentChain, node });
    if (node.children?.length) {
      flattenTree(node.children, levelIndex + 1, [...parentChain, node.id], map);
    }
  }
  return map;
}

export default function EntityDropdownTable({ entityState, setEntityState,isThere=false }: EntityDropdownProps) {
  const [treeData, setTreeData] = useState<TreeNodeType[]>([]);
  const [entityMap, setEntityMap] = useState<
    Map<string, { levelIndex: number; parentChain: string[]; node: TreeNodeType }>
  >(new Map());

  useEffect(() => {
    axios
      .get<TreeNodeType[]>(API_URL)
      .then((res) => {
        setTreeData(res.data);
        const map = flattenTree(res.data);
        setEntityMap(map);
      })
      .catch((err) => console.error("Failed to fetch hierarchy", err));
  }, []);

  // Prepare options by level keyed by entity IDs but labeled with names
  const optionsByLevel: Record<string, Option[]> = {};
  entityMap.forEach(({ levelIndex, node }) => {
    const levelKey = ENTITY_LEVELS[levelIndex];
    if (!optionsByLevel[levelKey]) optionsByLevel[levelKey] = [];
    optionsByLevel[levelKey].push({ label: node.name, value: node.id });
  });

  ENTITY_LEVELS.forEach((level) => {
    optionsByLevel[level]?.sort((a, b) => a.label.localeCompare(b.label));
  });

  // Helper: Given entity name, find the corresponding option value (id)
  const getIdFromName = (levelKey: string, name: string | null): string | null => {
    if (!name) return null;
    const options = optionsByLevel[levelKey] || [];
    const option = options.find((opt) => opt.label === name);
    return option ? option.value : null;
  };

  const handleChange = (levelKey: keyof EntityState, id: string | null) => {
    setEntityState((prev) => {
      const updated = { ...prev };

      if (!id) {
        // Clear current and all lower levels
        const levelIndex = ENTITY_LEVELS.indexOf(levelKey);
        for (let i = levelIndex; i < ENTITY_LEVELS.length; i++) {
          updated[ENTITY_LEVELS[i]] = null;
        }
      } else {
        const levelIndex = ENTITY_LEVELS.indexOf(levelKey);
        for (let i = levelIndex + 1; i < ENTITY_LEVELS.length; i++) {
          updated[ENTITY_LEVELS[i]] = null;
        }

        const entityInfo = entityMap.get(id);
        const entityName = entityInfo?.node.name || null;
        updated[levelKey] = entityName;

        if (levelIndex > 0) {
          // Fill parent names in higher levels
          const parentChain = entityInfo?.parentChain || [];
          parentChain.forEach((parentId, idx) => {
            const parentNode = entityMap.get(parentId);
            updated[ENTITY_LEVELS[idx]] = parentNode?.node.name || null;
          });
        }
      }

      return updated;
    });
  };

  return (
    <SectionCard title="Entity Details">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {ENTITY_LEVELS.map((levelKey, idx) => {
          const options = optionsByLevel[levelKey] || [];

          return (
            <CustomSelect
              key={levelKey}
              label={`Level ${idx}`}
              options={options}
              selectedValue={getIdFromName(levelKey, entityState[levelKey]) || ""}
              onChange={(val) => handleChange(levelKey, val || null)}
              placeholder="Select..."
              isDisabled={isThere} // Disable if isThere is true
            />
          );
        })}
      </div>
    </SectionCard>
  );
}
