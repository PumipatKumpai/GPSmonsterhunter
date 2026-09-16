import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import type { ImageSourcePropType } from "react-native";

import {
  Alert,
  Image,
  ImageBackground,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import MapView, { Circle, Marker } from "../../components/MapComponents.web";

// ======================================================
// IMAGES
// ======================================================

const BG_START = require("../../assets/images/backgrounds/bg_start.jpg");
const BG_BATTLE = require("../../assets/images/backgrounds/bg_battle.jpg");

const CLASS_IMAGES = {
  warrior: require("../../assets/images/class/warrior_class.png"),
  archer: require("../../assets/images/class/archer_class.png"),
  mage: require("../../assets/images/class/mage_class.png"),
};

const MONSTER_IMAGES = {
  goblin: require("../../assets/images/monster/monster_goblin.png"),
  slime: require("../../assets/images/monster/monster_slime.png"),
  golem: require("../../assets/images/monster/monster_golem.png"),
  wolf: require("../../assets/images/monster/monster_wolf.png"),
};

const EQUIPMENT_IMAGES = {
  sword: require("../../assets/images/equipment/weapon_sword.png"),
  bow: require("../../assets/images/equipment/weapon_bow.png"),
  staff: require("../../assets/images/equipment/weapon_staff.png"),

  heavyArmor: require("../../assets/images/equipment/armor_heavy.png"),
  lightArmor: require("../../assets/images/equipment/armor_light.png"),
  robe: require("../../assets/images/equipment/armor_robe.png"),

  ring: require("../../assets/images/equipment/accessory_ring.png"),
  feather: require("../../assets/images/equipment/accessory_feather.png"),
  charm: require("../../assets/images/equipment/accessory_charm.png"),
};

// ======================================================
// TYPES
// ======================================================

type Coordinates = {
  latitude: number;
  longitude: number;
};

type PlayerClassId = "warrior" | "archer" | "mage";

type EquipmentSlot = "weapon" | "armor" | "accessory";

type SkillId =
  | "guard"
  | "power_slash"
  | "dodge_stance"
  | "double_shot"
  | "magic_shield"
  | "arcane_burst";

type Skill = {
  id: SkillId;
  name: string;
  shortName: string;
  unlockLevel: number;
  description: string;
};

type PlayerClass = {
  id: PlayerClassId;
  name: string;
  role: string;
  description: string;

  color: string;
  image: ImageSourcePropType;

  baseHP: number;
  hpPerLevel: number;

  baseAttack: number;
  attackPerLevel: number;

  dodgeChance: number;

  baseShield: number;
  shieldPerLevel: number;

  attackActionCost: number;

  skills: Skill[];
};

type Monster = {
  id: number;

  name: string;

  level: number;

  hp: number;
  maxHp: number;

  exp: number;

  color: string;

  description: string;

  behaviorName: string;
  behaviorDescription: string;

  image: ImageSourcePropType;
};

type EquipmentItem = {
  id: string;

  classId: PlayerClassId;

  slot: EquipmentSlot;

  name: string;

  description: string;

  image: ImageSourcePropType;

  attackBonus?: number;
  hpBonus?: number;
  shieldBonus?: number;
  dodgeBonus?: number;
};

type EquipmentState = Partial<Record<EquipmentSlot, string>>;

type MonsterCollectionEntry = {
  discovered: boolean;
  defeated: number;
};

type QuestType = "defeat" | "discover";

type Quest = {
  id: number;
  title: string;
  description: string;
  type: QuestType;
  target: number;
  rewardExp: number;
};

type MonsterTurnOptions = {
  actionText?: string;

  guardOverride?: boolean;

  dodgeStanceOverride?: boolean;

  shieldOverride?: number;

  currentMonsterHP?: number;
};

// ======================================================
// CLASSES
// ======================================================

const PLAYER_CLASSES: PlayerClass[] = [
  {
    id: "warrior",

    name: "WARRIOR",

    role: "BALANCED FIGHTER",

    description:
      "นักรบที่มีพลังชีวิตและพลังโจมตีสมดุล เหมาะสำหรับการต่อสู้โดยตรง",

    color: "#E16A45",

    image: CLASS_IMAGES.warrior,

    baseHP: 120,
    hpPerLevel: 12,

    baseAttack: 22,
    attackPerLevel: 5,

    dodgeChance: 0,

    baseShield: 0,
    shieldPerLevel: 0,

    attackActionCost: 1,

    skills: [
      {
        id: "guard",

        name: "GUARD",

        shortName: "GD",

        unlockLevel: 2,

        description: "ลดความเสียหายจากการโจมตีครั้งถัดไปของ Monster ลง 60%",
      },

      {
        id: "power_slash",

        name: "POWER SLASH",

        shortName: "PS",

        unlockLevel: 4,

        description: "โจมตีรุนแรง 180% ของ ATK",
      },
    ],
  },

  {
    id: "archer",

    name: "ARCHER",

    role: "FAST DAMAGE DEALER",

    description:
      "นักธนูโจมตีแรงและว่องไว แต่มีพลังชีวิตต่ำและมีโอกาสหลบการโจมตี",

    color: "#3FA86B",

    image: CLASS_IMAGES.archer,

    baseHP: 85,
    hpPerLevel: 8,

    baseAttack: 28,
    attackPerLevel: 6,

    dodgeChance: 0.25,

    baseShield: 0,
    shieldPerLevel: 0,

    attackActionCost: 1,

    skills: [
      {
        id: "dodge_stance",

        name: "DODGE STANCE",

        shortName: "DS",

        unlockLevel: 2,

        description: "หลบการโจมตีครั้งถัดไปของ Monster ได้แน่นอน",
      },

      {
        id: "double_shot",

        name: "DOUBLE SHOT",

        shortName: "2X",

        unlockLevel: 4,

        description: "สร้างความเสียหายรวม 150% ของ ATK",
      },
    ],
  },

  {
    id: "mage",

    name: "MAGE",

    role: "ARCANE DAMAGE DEALER",

    description:
      "นักเวทย์สร้างความเสียหายสูง มีเกราะเวทย์ แต่ต้องใช้เวลาในการร่ายเวท",

    color: "#7357D8",

    image: CLASS_IMAGES.mage,

    baseHP: 95,
    hpPerLevel: 9,

    baseAttack: 36,
    attackPerLevel: 7,

    dodgeChance: 0,

    baseShield: 30,
    shieldPerLevel: 5,

    attackActionCost: 2,

    skills: [
      {
        id: "magic_shield",

        name: "MAGIC SHIELD",

        shortName: "MS",

        unlockLevel: 2,

        description: "ฟื้นฟู Magic Shield 20 หน่วย",
      },

      {
        id: "arcane_burst",

        name: "ARCANE BURST",

        shortName: "AB",

        unlockLevel: 4,

        description: "เวท 200% ATK แต่ต้องใช้ 2 Actions",
      },
    ],
  },
];

// ======================================================
// EQUIPMENT
// ======================================================

const EQUIPMENT_ITEMS: EquipmentItem[] = [
  // ----------------------------------------------------
  // WARRIOR
  // ----------------------------------------------------

  {
    id: "warrior_sword",

    classId: "warrior",

    slot: "weapon",

    name: "BRONZE SWORD",

    description: "ดาบเริ่มต้นของ Warrior เพิ่มพลังโจมตี",

    image: EQUIPMENT_IMAGES.sword,

    attackBonus: 5,
  },

  {
    id: "warrior_armor",

    classId: "warrior",

    slot: "armor",

    name: "HEAVY ARMOR",

    description: "เกราะหนักสำหรับการยืนแนวหน้า",

    image: EQUIPMENT_IMAGES.heavyArmor,

    hpBonus: 20,
  },

  {
    id: "warrior_ring",

    classId: "warrior",

    slot: "accessory",

    name: "KNIGHT RING",

    description: "แหวนของนักรบ เพิ่มพลังชีวิต",

    image: EQUIPMENT_IMAGES.ring,

    hpBonus: 10,
  },

  // ----------------------------------------------------
  // ARCHER
  // ----------------------------------------------------

  {
    id: "archer_bow",

    classId: "archer",

    slot: "weapon",

    name: "HUNTER BOW",

    description: "ธนูของนักล่า เพิ่มความเสียหาย",

    image: EQUIPMENT_IMAGES.bow,

    attackBonus: 7,
  },

  {
    id: "archer_armor",

    classId: "archer",

    slot: "armor",

    name: "LIGHT ARMOR",

    description: "เกราะเบาที่ไม่ลดความคล่องตัว",

    image: EQUIPMENT_IMAGES.lightArmor,

    hpBonus: 10,
  },

  {
    id: "archer_feather",

    classId: "archer",

    slot: "accessory",

    name: "FEATHER CHARM",

    description: "เพิ่มโอกาสหลบการโจมตีอีก 10%",

    image: EQUIPMENT_IMAGES.feather,

    dodgeBonus: 0.1,
  },

  // ----------------------------------------------------
  // MAGE
  // ----------------------------------------------------

  {
    id: "mage_staff",

    classId: "mage",

    slot: "weapon",

    name: "APPRENTICE STAFF",

    description: "คทาเวทมนตร์ เพิ่มพลังเวทโจมตี",

    image: EQUIPMENT_IMAGES.staff,

    attackBonus: 8,
  },

  {
    id: "mage_robe",

    classId: "mage",

    slot: "armor",

    name: "MYSTIC ROBE",

    description: "ชุดคลุมเวทมนตร์ เพิ่มพลังชีวิต",

    image: EQUIPMENT_IMAGES.robe,

    hpBonus: 10,
  },

  {
    id: "mage_charm",

    classId: "mage",

    slot: "accessory",

    name: "MANA CHARM",

    description: "เครื่องรางเวทมนตร์ เพิ่ม Magic Shield",

    image: EQUIPMENT_IMAGES.charm,

    shieldBonus: 15,
  },
];

// ======================================================
// MONSTERS
// ======================================================

const MONSTERS: Monster[] = [
  {
    id: 1,

    name: "FOREST GOBLIN",

    level: 1,

    hp: 100,
    maxHp: 100,

    exp: 50,

    color: "#4CAF50",

    description: "A small creature hiding around green areas.",

    behaviorName: "SNEAKY STRIKE",

    behaviorDescription:
      "โจมตีปกติ 10 Damage และมีโอกาส 20% โจมตีแรงเป็น 14 Damage",

    image: MONSTER_IMAGES.goblin,
  },

  {
    id: 2,

    name: "WILD SLIME",

    level: 1,

    hp: 80,
    maxHp: 80,

    exp: 40,

    color: "#26C6DA",

    description: "A mysterious slime roaming around the area.",

    behaviorName: "REBIRTH",

    behaviorDescription: "เมื่อตายครั้งแรก จะฟื้นคืนชีพ 1 ครั้งด้วย HP 40%",

    image: MONSTER_IMAGES.slime,
  },

  {
    id: 3,

    name: "STONE GOLEM",

    level: 2,

    hp: 150,
    maxHp: 150,

    exp: 75,

    color: "#8D6E63",

    description: "A powerful creature made from ancient stone.",

    behaviorName: "CHARGED SMASH",

    behaviorDescription: "ชาร์จ 1 Action ก่อนโจมตีรุนแรง 28 Damage",

    image: MONSTER_IMAGES.golem,
  },

  {
    id: 4,

    name: "SHADOW WOLF",

    level: 2,

    hp: 120,
    maxHp: 120,

    exp: 65,

    color: "#7E57C2",

    description: "A fast hunter that moves silently in the shadows.",

    behaviorName: "SHADOW AGILITY",

    behaviorDescription:
      "มีโอกาสหลบ 30% และเข้าสู่ Frenzy เมื่อ HP ต่ำกว่า 50%",

    image: MONSTER_IMAGES.wolf,
  },
];

// ======================================================
// QUESTS
// ======================================================

const QUESTS: Quest[] = [
  {
    id: 1,

    title: "FIRST HUNT",

    description: "Defeat your first Monster",

    type: "defeat",

    target: 1,

    rewardExp: 50,
  },

  {
    id: 2,

    title: "MONSTER HUNTER",

    description: "Defeat 3 Monsters",

    type: "defeat",

    target: 3,

    rewardExp: 100,
  },

  {
    id: 3,

    title: "MONSTER RESEARCH",

    description: "Discover 2 Monster types",

    type: "discover",

    target: 2,

    rewardExp: 100,
  },

  {
    id: 4,

    title: "MASTER COLLECTOR",

    description: "Discover every Monster type",

    type: "discover",

    target: MONSTERS.length,

    rewardExp: 200,
  },
];

// ======================================================
// BASE PLAYER STATS
// ======================================================

const getBasePlayerMaxHP = (level: number, playerClass: PlayerClass) => {
  return playerClass.baseHP + (level - 1) * playerClass.hpPerLevel;
};

const getBasePlayerAttack = (level: number, playerClass: PlayerClass) => {
  return playerClass.baseAttack + (level - 1) * playerClass.attackPerLevel;
};

const getBasePlayerShield = (level: number, playerClass: PlayerClass) => {
  return playerClass.baseShield + (level - 1) * playerClass.shieldPerLevel;
};

const getRequiredExp = (level: number) => {
  return level * 100;
};

// ======================================================
// INITIAL COLLECTION
// ======================================================

const createInitialCollection = (): Record<number, MonsterCollectionEntry> => {
  const collection: Record<number, MonsterCollectionEntry> = {};

  MONSTERS.forEach((monster) => {
    collection[monster.id] = {
      discovered: false,
      defeated: 0,
    };
  });

  return collection;
};

// ======================================================
// MAIN
// ======================================================

export default function HomeScreen() {
  // ====================================================
  // CLASS
  // ====================================================

  const [classChoice, setClassChoice] = useState<PlayerClassId>("warrior");

  const [selectedClassId, setSelectedClassId] = useState<PlayerClassId | null>(
    null,
  );

  const activeClass =
    PLAYER_CLASSES.find(
      (item) => item.id === (selectedClassId ?? classChoice),
    ) ?? PLAYER_CLASSES[0];

  // ====================================================
  // EQUIPMENT
  // ====================================================

  const [equipmentVisible, setEquipmentVisible] = useState(false);

  const [equippedItems, setEquippedItems] = useState<EquipmentState>({});

  const classEquipment = EQUIPMENT_ITEMS.filter(
    (item) => item.classId === activeClass.id,
  );

  const equippedEquipment = Object.values(equippedItems)
    .map((equipmentId) =>
      EQUIPMENT_ITEMS.find((item) => item.id === equipmentId),
    )
    .filter((item): item is EquipmentItem => Boolean(item));

  const equipmentBonuses = equippedEquipment.reduce(
    (total, item) => {
      return {
        hp: total.hp + (item.hpBonus ?? 0),

        attack: total.attack + (item.attackBonus ?? 0),

        shield: total.shield + (item.shieldBonus ?? 0),

        dodge: total.dodge + (item.dodgeBonus ?? 0),
      };
    },
    {
      hp: 0,
      attack: 0,
      shield: 0,
      dodge: 0,
    },
  );

  const equippedCount = equippedEquipment.length;

  // ====================================================
  // GPS
  // ====================================================

  const [playerLocation, setPlayerLocation] = useState<Coordinates | null>(
    null,
  );

  const [monsterLocation, setMonsterLocation] = useState<Coordinates | null>(
    null,
  );

  const [distance, setDistance] = useState<number | null>(null);

  const [locationStarted, setLocationStarted] = useState(false);

  // ====================================================
  // MONSTER
  // ====================================================

  const [monster, setMonster] = useState<Monster | null>(null);

  const [selectedMonster, setSelectedMonster] = useState(false);

  // ====================================================
  // BATTLE
  // ====================================================

  const [battleStarted, setBattleStarted] = useState(false);

  const [playerHP, setPlayerHP] = useState(120);

  const [playerShield, setPlayerShield] = useState(0);

  const [monsterHP, setMonsterHP] = useState(100);

  const [battleMessage, setBattleMessage] = useState("READY FOR BATTLE");

  // ====================================================
  // ACTION STATES
  // ====================================================

  const [attackActionProgress, setAttackActionProgress] = useState(0);

  const [arcaneBurstCasting, setArcaneBurstCasting] = useState(false);

  // ====================================================
  // DEFENSIVE STATES
  // ====================================================

  const [guardActive, setGuardActive] = useState(false);

  const [dodgeStanceActive, setDodgeStanceActive] = useState(false);

  // ====================================================
  // MONSTER STATES
  // ====================================================

  const [monsterCharging, setMonsterCharging] = useState(false);

  const [slimeRevived, setSlimeRevived] = useState(false);

  // ====================================================
  // SKILLS
  // ====================================================

  const [usedSkills, setUsedSkills] = useState<Record<string, boolean>>({});

  // ====================================================
  // LEVEL
  // ====================================================

  const [playerLevel, setPlayerLevel] = useState(1);

  const [exp, setExp] = useState(0);

  // ====================================================
  // LEVEL UP
  // ====================================================

  const [levelUpVisible, setLevelUpVisible] = useState(false);

  const [oldLevel, setOldLevel] = useState(1);

  const [newLevel, setNewLevel] = useState(1);

  // ====================================================
  // COLLECTION
  // ====================================================

  const [monsterCollection, setMonsterCollection] = useState<
    Record<number, MonsterCollectionEntry>
  >(createInitialCollection);

  const [collectionVisible, setCollectionVisible] = useState(false);

  // ====================================================
  // QUEST
  // ====================================================

  const [questVisible, setQuestVisible] = useState(false);

  const [claimedQuests, setClaimedQuests] = useState<Record<number, boolean>>(
    {},
  );

  // ====================================================
  // TOTAL PLAYER STATS
  // ====================================================

  const playerMaxHP =
    getBasePlayerMaxHP(playerLevel, activeClass) + equipmentBonuses.hp;

  const playerAttack =
    getBasePlayerAttack(playerLevel, activeClass) + equipmentBonuses.attack;

  const playerMaxShield =
    getBasePlayerShield(playerLevel, activeClass) + equipmentBonuses.shield;

  const dodgeChance = Math.min(
    0.75,
    activeClass.dodgeChance + equipmentBonuses.dodge,
  );

  const attackActionCost = activeClass.attackActionCost;

  const requiredExp = getRequiredExp(playerLevel);

  const expPercentage = Math.min((exp / requiredExp) * 100, 100);

  const mapRef = useRef<any>(null);

  // ====================================================
  // COLLECTION DATA
  // ====================================================

  const discoveredCount = MONSTERS.filter(
    (item) => monsterCollection[item.id]?.discovered,
  ).length;

  const totalDefeated = MONSTERS.reduce((total, item) => {
    return total + (monsterCollection[item.id]?.defeated ?? 0);
  }, 0);

  // ====================================================
  // QUEST DATA
  // ====================================================

  const getQuestProgress = (quest: Quest) => {
    if (quest.type === "defeat") {
      return Math.min(totalDefeated, quest.target);
    }

    return Math.min(discoveredCount, quest.target);
  };

  const isQuestComplete = (quest: Quest) => {
    return getQuestProgress(quest) >= quest.target;
  };

  const completedQuestCount = QUESTS.filter((quest) =>
    isQuestComplete(quest),
  ).length;

  // ====================================================
  // NEW SKILL
  // ====================================================

  const newUnlockedSkills = activeClass.skills.filter(
    (skill) => skill.unlockLevel > oldLevel && skill.unlockLevel <= newLevel,
  );

  // ====================================================
  // CLASS SELECT
  // ====================================================

  const confirmClass = () => {
    const chosenClass =
      PLAYER_CLASSES.find((item) => item.id === classChoice) ??
      PLAYER_CLASSES[0];

    setSelectedClassId(chosenClass.id);

    setEquippedItems({});

    setPlayerHP(getBasePlayerMaxHP(playerLevel, chosenClass));

    setPlayerShield(getBasePlayerShield(playerLevel, chosenClass));
  };

  // ====================================================
  // EQUIPMENT FUNCTIONS
  // ====================================================

  const equipItem = (item: EquipmentItem) => {
    if (item.classId !== activeClass.id) {
      return;
    }

    setEquippedItems((previous) => {
      const alreadyEquipped = previous[item.slot] === item.id;

      if (alreadyEquipped) {
        const next = {
          ...previous,
        };

        delete next[item.slot];

        return next;
      }

      return {
        ...previous,

        [item.slot]: item.id,
      };
    });
  };

  const getEquippedItem = (slot: EquipmentSlot) => {
    const equipmentId = equippedItems[slot];

    if (!equipmentId) {
      return null;
    }

    return EQUIPMENT_ITEMS.find((item) => item.id === equipmentId) ?? null;
  };

  const getEquipmentBonusText = (item: EquipmentItem) => {
    const values: string[] = [];

    if (item.attackBonus) {
      values.push(`ATK +${item.attackBonus}`);
    }

    if (item.hpBonus) {
      values.push(`HP +${item.hpBonus}`);
    }

    if (item.shieldBonus) {
      values.push(`SHIELD +${item.shieldBonus}`);
    }

    if (item.dodgeBonus) {
      values.push(`DODGE +${Math.round(item.dodgeBonus * 100)}%`);
    }

    return values.join(" • ");
  };

  // ====================================================
  // DISTANCE
  // ====================================================

  const calculateDistance = (point1: Coordinates, point2: Coordinates) => {
    const R = 6371000;

    const lat1 = (point1.latitude * Math.PI) / 180;

    const lat2 = (point2.latitude * Math.PI) / 180;

    const deltaLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;

    const deltaLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // ====================================================
  // COLLECTION
  // ====================================================

  const discoverMonster = (monsterId: number) => {
    setMonsterCollection((previous) => {
      const current = previous[monsterId];

      if (!current || current.discovered) {
        return previous;
      }

      return {
        ...previous,

        [monsterId]: {
          ...current,

          discovered: true,
        },
      };
    });
  };

  const recordMonsterDefeat = (monsterId: number) => {
    setMonsterCollection((previous) => {
      const current = previous[monsterId] ?? {
        discovered: true,

        defeated: 0,
      };

      return {
        ...previous,

        [monsterId]: {
          discovered: true,

          defeated: current.defeated + 1,
        },
      };
    });
  };

  // ====================================================
  // RESET BATTLE
  // ====================================================

  const resetBattleStates = () => {
    setAttackActionProgress(0);

    setArcaneBurstCasting(false);

    setGuardActive(false);

    setDodgeStanceActive(false);

    setMonsterCharging(false);

    setSlimeRevived(false);

    setUsedSkills({});
  };

  // ====================================================
  // MONSTER SPAWN
  // ====================================================

  const createMonster = (location: Coordinates) => {
    const randomMonster = MONSTERS[Math.floor(Math.random() * MONSTERS.length)];

    const randomAngle = Math.random() * Math.PI * 2;

    const distanceInMeters = 5;

    const latitudeOffset = (distanceInMeters * Math.cos(randomAngle)) / 111320;

    const longitudeOffset =
      (distanceInMeters * Math.sin(randomAngle)) /
      (111320 * Math.cos((location.latitude * Math.PI) / 180));

    const newLocation = {
      latitude: location.latitude + latitudeOffset,

      longitude: location.longitude + longitudeOffset,
    };

    setMonster(randomMonster);

    setMonsterLocation(newLocation);

    setDistance(calculateDistance(location, newLocation));

    setSelectedMonster(false);

    setMonsterHP(randomMonster.maxHp);

    resetBattleStates();
  };

  // ====================================================
  // START GPS
  // ====================================================

  const startHunt = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("GPS Permission", "กรุณาอนุญาตให้แอปเข้าถึงตำแหน่ง");

        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: current.coords.latitude,

        longitude: current.coords.longitude,
      };

      setPlayerLocation(coords);

      setLocationStarted(true);

      createMonster(coords);

      mapRef.current?.animateToRegion(
        {
          latitude: coords.latitude,

          longitude: coords.longitude,

          latitudeDelta: 0.0015,

          longitudeDelta: 0.0015,
        },

        1000,
      );
    } catch {
      Alert.alert("GPS Error", "ไม่สามารถอ่านตำแหน่ง GPS ได้");
    }
  };

  // ====================================================
  // GPS WATCH
  // ====================================================

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startWatching = async () => {
      if (!locationStarted) {
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,

          distanceInterval: 1,

          timeInterval: 1000,
        },

        (location) => {
          setPlayerLocation({
            latitude: location.coords.latitude,

            longitude: location.coords.longitude,
          });
        },
      );
    };

    startWatching();

    return () => {
      subscription?.remove();
    };
  }, [locationStarted]);

  // ====================================================
  // DISTANCE WATCH
  // ====================================================

  useEffect(() => {
    if (playerLocation && monsterLocation) {
      setDistance(calculateDistance(playerLocation, monsterLocation));
    }
  }, [playerLocation, monsterLocation]);

  // ====================================================
  // MONSTER SELECT
  // ====================================================

  const selectMonster = () => {
    if (distance === null || !monster) {
      return;
    }

    if (distance <= 10) {
      discoverMonster(monster.id);

      setSelectedMonster(true);

      return;
    }

    Alert.alert(
      "MONSTER TOO FAR",

      `คุณอยู่ห่างจาก ${monster.name} ${distance.toFixed(1)} เมตร`,
    );
  };

  // ====================================================
  // ENTER BATTLE
  // ====================================================

  const enterBattle = () => {
    if (!monster || distance === null || distance > 10) {
      return;
    }

    resetBattleStates();

    setBattleStarted(true);

    setPlayerHP(playerMaxHP);

    setPlayerShield(playerMaxShield);

    setMonsterHP(monster.maxHp);

    setBattleMessage(`${monster.name} appeared!\n${monster.behaviorName}`);
  };

  // ====================================================
  // EXP
  // ====================================================

  const addPlayerExp = (amount: number) => {
    const startingLevel = playerLevel;

    let currentLevel = playerLevel;

    let currentExp = exp + amount;

    while (currentExp >= getRequiredExp(currentLevel)) {
      currentExp -= getRequiredExp(currentLevel);

      currentLevel += 1;
    }

    setExp(currentExp);

    setPlayerLevel(currentLevel);

    const leveledUp = currentLevel > startingLevel;

    if (leveledUp) {
      setOldLevel(startingLevel);

      setNewLevel(currentLevel);
    }

    return {
      currentLevel,

      leveledUp,
    };
  };

  // ====================================================
  // QUEST REWARD
  // ====================================================

  const claimQuestReward = (quest: Quest) => {
    if (!isQuestComplete(quest) || claimedQuests[quest.id]) {
      return;
    }

    const result = addPlayerExp(quest.rewardExp);

    setClaimedQuests((previous) => ({
      ...previous,

      [quest.id]: true,
    }));

    Alert.alert(
      "MISSION COMPLETE",

      `${quest.title}\n\n+${quest.rewardExp} EXP`,

      [
        {
          text: "CONTINUE",

          onPress: () => {
            if (result.leveledUp) {
              setQuestVisible(false);

              setTimeout(() => {
                setLevelUpVisible(true);
              }, 250);
            }
          },
        },
      ],
    );
  };

  // ====================================================
  // PLAYER DEFEAT
  // ====================================================

  const handlePlayerDefeat = () => {
    if (!monster) {
      return;
    }

    setTimeout(() => {
      Alert.alert(
        "DEFEAT",

        `${monster.name} defeated you.`,

        [
          {
            text: "RETURN TO MAP",

            onPress: () => {
              setBattleStarted(false);

              setPlayerHP(playerMaxHP);

              setPlayerShield(playerMaxShield);

              setMonsterHP(monster.maxHp);

              resetBattleStates();
            },
          },
        ],
      );
    }, 100);
  };

  // ====================================================
  // DAMAGE PLAYER
  // ====================================================

  const monsterAttackPlayer = (
    damage: number,
    options?: MonsterTurnOptions,
  ) => {
    if (!monster) {
      return;
    }

    const prefix = options?.actionText ? `${options.actionText}\n` : "";

    // --------------------------------------------------
    // GUARANTEED DODGE
    // --------------------------------------------------

    const guaranteedDodge = options?.dodgeStanceOverride ?? dodgeStanceActive;

    if (guaranteedDodge) {
      setDodgeStanceActive(false);

      setBattleMessage(
        `${prefix}DODGE STANCE! ${activeClass.name} avoided the attack.`,
      );

      return;
    }

    // --------------------------------------------------
    // PASSIVE DODGE + EQUIPMENT
    // --------------------------------------------------

    if (dodgeChance > 0 && Math.random() < dodgeChance) {
      setBattleMessage(
        `${prefix}DODGE! ${activeClass.name} avoided the attack.`,
      );

      return;
    }

    // --------------------------------------------------
    // GUARD
    // --------------------------------------------------

    const guarding = options?.guardOverride ?? guardActive;

    let finalDamage = damage;

    let guardText = "";

    if (guarding) {
      finalDamage = Math.max(
        1,

        Math.round(damage * 0.4),
      );

      setGuardActive(false);

      guardText = `GUARD reduced ${damage} → ${finalDamage} Damage.\n`;
    }

    // --------------------------------------------------
    // MAGIC SHIELD
    // --------------------------------------------------

    const availableShield = options?.shieldOverride ?? playerShield;

    if (availableShield > 0) {
      const absorbed = Math.min(availableShield, finalDamage);

      const remaining = finalDamage - absorbed;

      setPlayerShield(Math.max(availableShield - absorbed, 0));

      if (remaining <= 0) {
        setBattleMessage(
          `${prefix}${guardText}MAGIC SHIELD absorbed ${absorbed} Damage.`,
        );

        return;
      }

      setBattleMessage(
        `${prefix}${guardText}Shield absorbed ${absorbed}. HP took ${remaining}.`,
      );

      setPlayerHP((previous) => {
        const nextHP = Math.max(previous - remaining, 0);

        if (nextHP <= 0) {
          handlePlayerDefeat();
        }

        return nextHP;
      });

      return;
    }

    // --------------------------------------------------
    // HP
    // --------------------------------------------------

    setBattleMessage(
      `${prefix}${guardText}${activeClass.name} took ${finalDamage} Damage.`,
    );

    setPlayerHP((previous) => {
      const nextHP = Math.max(previous - finalDamage, 0);

      if (nextHP <= 0) {
        handlePlayerDefeat();
      }

      return nextHP;
    });
  };

  // ====================================================
  // MONSTER TURN
  // ====================================================

  const performMonsterTurn = (options?: MonsterTurnOptions) => {
    if (!monster) {
      return;
    }

    const actionText = options?.actionText ?? "";

    // --------------------------------------------------
    // GOBLIN
    // --------------------------------------------------

    if (monster.id === 1) {
      const sneaky = Math.random() < 0.2;

      monsterAttackPlayer(
        sneaky ? 14 : 10,

        {
          ...options,

          actionText: `${actionText}${actionText ? "\n" : ""}${
            sneaky ? "SNEAKY STRIKE!" : "GOBLIN STRIKE!"
          }`,
        },
      );

      return;
    }

    // --------------------------------------------------
    // SLIME
    // --------------------------------------------------

    if (monster.id === 2) {
      monsterAttackPlayer(8, {
        ...options,

        actionText: `${actionText}${actionText ? "\n" : ""}SLIME BOUNCE!`,
      });

      return;
    }

    // --------------------------------------------------
    // GOLEM
    // --------------------------------------------------

    if (monster.id === 3) {
      if (!monsterCharging) {
        setMonsterCharging(true);

        setBattleMessage(
          `${actionText}${
            actionText ? "\n" : ""
          }STONE GOLEM IS CHARGING...\nCharged Smash will strike next Action!`,
        );

        return;
      }

      setMonsterCharging(false);

      monsterAttackPlayer(28, {
        ...options,

        actionText: `${actionText}${actionText ? "\n" : ""}CHARGED SMASH!`,
      });

      return;
    }

    // --------------------------------------------------
    // WOLF
    // --------------------------------------------------

    if (monster.id === 4) {
      const currentHP = options?.currentMonsterHP ?? monsterHP;

      const frenzy = currentHP <= monster.maxHp * 0.5;

      monsterAttackPlayer(
        frenzy ? 16 : 12,

        {
          ...options,

          actionText: `${actionText}${actionText ? "\n" : ""}${
            frenzy ? "SHADOW FRENZY!" : "SHADOW CLAW!"
          }`,
        },
      );
    }
  };

  // ====================================================
  // VICTORY
  // ====================================================

  const handleVictory = () => {
    if (!monster) {
      return;
    }

    recordMonsterDefeat(monster.id);

    const result = addPlayerExp(monster.exp);

    Alert.alert(
      "VICTORY",

      `${monster.name} DEFEATED!\n\n+${monster.exp} EXP`,

      [
        {
          text: "CONTINUE HUNT",

          onPress: () => {
            setBattleStarted(false);

            setSelectedMonster(false);

            resetBattleStates();

            setPlayerHP(
              getBasePlayerMaxHP(result.currentLevel, activeClass) +
                equipmentBonuses.hp,
            );

            setPlayerShield(
              getBasePlayerShield(result.currentLevel, activeClass) +
                equipmentBonuses.shield,
            );

            if (result.leveledUp) {
              setTimeout(() => {
                setLevelUpVisible(true);
              }, 250);
            }

            if (playerLocation) {
              createMonster(playerLocation);
            }
          },
        },
      ],
    );
  };

  // ====================================================
  // DAMAGE MONSTER
  // ====================================================

  const dealDamageToMonster = (damage: number, actionName: string) => {
    if (!monster) {
      return;
    }

    // --------------------------------------------------
    // WOLF EVADE
    // --------------------------------------------------

    if (monster.id === 4 && Math.random() < 0.3) {
      performMonsterTurn({
        actionText: `${actionName} missed!\nSHADOW WOLF EVADED THE ATTACK.`,
      });

      return;
    }

    const newHP = Math.max(monsterHP - damage, 0);

    // --------------------------------------------------
    // SLIME REBIRTH
    // --------------------------------------------------

    if (newHP <= 0 && monster.id === 2 && !slimeRevived) {
      const reviveHP = Math.ceil(monster.maxHp * 0.4);

      setSlimeRevived(true);

      setMonsterHP(reviveHP);

      setBattleMessage(
        `${actionName} dealt ${damage} Damage!\n\nREBIRTH!\nWILD SLIME revived with ${reviveHP} HP.`,
      );

      return;
    }

    setMonsterHP(newHP);

    if (newHP <= 0) {
      handleVictory();

      return;
    }

    performMonsterTurn({
      actionText: `${actionName} dealt ${damage} Damage!`,

      currentMonsterHP: newHP,
    });
  };

  // ====================================================
  // NORMAL ATTACK
  // ====================================================

  const attackMonster = () => {
    if (!monster) {
      return;
    }

    if (arcaneBurstCasting) {
      return;
    }

    // Mage normal casting

    if (attackActionCost > 1 && attackActionProgress < attackActionCost - 1) {
      const next = attackActionProgress + 1;

      setAttackActionProgress(next);

      performMonsterTurn({
        actionText: `CHANTING SPELL... ${next}/${attackActionCost}`,
      });

      return;
    }

    setAttackActionProgress(0);

    dealDamageToMonster(
      playerAttack,

      activeClass.id === "mage" ? "ARCANE BOLT" : "NORMAL ATTACK",
    );
  };

  // ====================================================
  // SKILL USED
  // ====================================================

  const markSkillUsed = (skillId: SkillId) => {
    setUsedSkills((previous) => ({
      ...previous,

      [skillId]: true,
    }));
  };

  // ====================================================
  // SKILL AVAILABLE
  // ====================================================

  const isSkillAvailable = (skill: Skill) => {
    if (playerLevel < skill.unlockLevel) {
      return false;
    }

    if (usedSkills[skill.id]) {
      return false;
    }

    if (attackActionProgress > 0) {
      return false;
    }

    if (arcaneBurstCasting && skill.id !== "arcane_burst") {
      return false;
    }

    if (skill.id === "magic_shield" && playerShield >= playerMaxShield) {
      return false;
    }

    return true;
  };

  const getSkillStatusText = (skill: Skill) => {
    if (playerLevel < skill.unlockLevel) {
      return `UNLOCK LV.${skill.unlockLevel}`;
    }

    if (usedSkills[skill.id]) {
      return "USED";
    }

    if (skill.id === "arcane_burst" && arcaneBurstCasting) {
      return "CAST NOW";
    }

    if (skill.id === "magic_shield" && playerShield >= playerMaxShield) {
      return "SHIELD FULL";
    }

    return "USE SKILL";
  };

  // ====================================================
  // USE SKILL
  // ====================================================

  const useSkill = (skill: Skill) => {
    if (!isSkillAvailable(skill)) {
      return;
    }

    // --------------------------------------------------
    // GUARD
    // --------------------------------------------------

    if (skill.id === "guard") {
      markSkillUsed(skill.id);

      setGuardActive(true);

      performMonsterTurn({
        guardOverride: true,

        actionText: "GUARD ACTIVATED!",
      });

      return;
    }

    // --------------------------------------------------
    // POWER SLASH
    // --------------------------------------------------

    if (skill.id === "power_slash") {
      markSkillUsed(skill.id);

      dealDamageToMonster(
        Math.round(playerAttack * 1.8),

        "POWER SLASH",
      );

      return;
    }

    // --------------------------------------------------
    // DODGE STANCE
    // --------------------------------------------------

    if (skill.id === "dodge_stance") {
      markSkillUsed(skill.id);

      setDodgeStanceActive(true);

      performMonsterTurn({
        dodgeStanceOverride: true,

        actionText: "DODGE STANCE ACTIVATED!",
      });

      return;
    }

    // --------------------------------------------------
    // DOUBLE SHOT
    // --------------------------------------------------

    if (skill.id === "double_shot") {
      markSkillUsed(skill.id);

      dealDamageToMonster(
        Math.round(playerAttack * 1.5),

        "DOUBLE SHOT",
      );

      return;
    }

    // --------------------------------------------------
    // MAGIC SHIELD
    // --------------------------------------------------

    if (skill.id === "magic_shield") {
      const newShield = Math.min(
        playerMaxShield,

        playerShield + 20,
      );

      markSkillUsed(skill.id);

      setPlayerShield(newShield);

      performMonsterTurn({
        shieldOverride: newShield,

        actionText: `MAGIC SHIELD restored to ${newShield}.`,
      });

      return;
    }

    // --------------------------------------------------
    // ARCANE BURST
    // --------------------------------------------------

    if (skill.id === "arcane_burst") {
      if (!arcaneBurstCasting) {
        setArcaneBurstCasting(true);

        performMonsterTurn({
          actionText: "CHANTING ARCANE BURST... 1/2",
        });

        return;
      }

      setArcaneBurstCasting(false);

      markSkillUsed(skill.id);

      dealDamageToMonster(
        Math.round(playerAttack * 2),

        "ARCANE BURST",
      );
    }
  };

  // ====================================================
  // MY LOCATION
  // ====================================================

  const goToMyLocation = () => {
    if (!playerLocation) {
      return;
    }

    mapRef.current?.animateToRegion(
      {
        latitude: playerLocation.latitude,

        longitude: playerLocation.longitude,

        latitudeDelta: 0.0015,

        longitudeDelta: 0.0015,
      },

      700,
    );
  };

  // ====================================================
  // CLASS SELECTION SCREEN
  // ====================================================

  if (selectedClassId === null) {
    const previewClass =
      PLAYER_CLASSES.find((item) => item.id === classChoice) ??
      PLAYER_CLASSES[0];

    return (
      <ImageBackground
        source={BG_START}
        style={styles.classBackground}
        resizeMode="cover"
      >
        <View style={styles.backgroundOverlay} />

        <View style={styles.classScreen}>
          <View style={styles.classHeader}>
            <Text style={styles.classTopLabel}>GPS MONSTER HUNTER</Text>

            <Text style={styles.classTitle}>CHOOSE YOUR CLASS</Text>

            <Text style={styles.classSubtitle}>
              เลือกอาชีพเริ่มต้น แต่ละอาชีพมีค่าสเตตัส สกิล และอุปกรณ์เฉพาะตัว
            </Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.classList}
            showsVerticalScrollIndicator={false}
          >
            {PLAYER_CLASSES.map((playerClass) => {
              const selected = classChoice === playerClass.id;

              return (
                <TouchableOpacity
                  key={playerClass.id}
                  style={[
                    styles.classCard,

                    selected && {
                      borderColor: playerClass.color,
                    },
                  ]}
                  onPress={() => setClassChoice(playerClass.id)}
                >
                  <View
                    style={[
                      styles.classImageArea,

                      {
                        backgroundColor: `${playerClass.color}18`,
                      },
                    ]}
                  >
                    <Image
                      source={playerClass.image}
                      style={styles.classImage}
                      resizeMode="contain"
                    />
                  </View>

                  <View style={styles.classInformation}>
                    <View style={styles.classNameRow}>
                      <View>
                        <Text style={styles.className}>{playerClass.name}</Text>

                        <Text
                          style={[
                            styles.classRole,

                            {
                              color: playerClass.color,
                            },
                          ]}
                        >
                          {playerClass.role}
                        </Text>
                      </View>

                      {selected && (
                        <View
                          style={[
                            styles.selectedBadge,

                            {
                              backgroundColor: playerClass.color,
                            },
                          ]}
                        >
                          <Text style={styles.selectedBadgeText}>SELECTED</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.classDescription}>
                      {playerClass.description}
                    </Text>

                    <View style={styles.classStats}>
                      <ClassStat label="HP" value={`${playerClass.baseHP}`} />

                      <ClassStat
                        label="ATK"
                        value={`${playerClass.baseAttack}`}
                      />

                      <ClassStat
                        label="ACTION"
                        value={`${playerClass.attackActionCost}`}
                      />
                    </View>

                    <View style={styles.skillPathBox}>
                      <Text style={styles.skillPathTitle}>SKILL PATH</Text>

                      {playerClass.skills.map((skill) => (
                        <Text key={skill.id} style={styles.skillPathText}>
                          LV.
                          {skill.unlockLevel} • {skill.name}
                        </Text>
                      ))}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[
                styles.confirmClassButton,

                {
                  backgroundColor: previewClass.color,
                },
              ]}
              onPress={confirmClass}
            >
              <View>
                <Text style={styles.confirmSmall}>START ADVENTURE AS</Text>

                <Text style={styles.confirmName}>{previewClass.name}</Text>
              </View>

              <Text style={styles.confirmArrow}>›</Text>
            </TouchableOpacity>

            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </ImageBackground>
    );
  }

  // ====================================================
  // BATTLE SCREEN
  // ====================================================

  if (battleStarted && monster) {
    const monsterHpPercentage = Math.max(
      0,

      (monsterHP / monster.maxHp) * 100,
    );

    const playerHpPercentage = Math.max(
      0,

      (playerHP / playerMaxHP) * 100,
    );

    const shieldPercentage =
      playerMaxShield > 0
        ? Math.max(
            0,

            (playerShield / playerMaxShield) * 100,
          )
        : 0;

    const normalMageCasting =
      activeClass.id === "mage" && attackActionProgress > 0;

    const wolfFrenzy = monster.id === 4 && monsterHP <= monster.maxHp * 0.5;

    return (
      <ImageBackground
        source={BG_BATTLE}
        style={styles.battleBackground}
        resizeMode="cover"
      >
        <View style={styles.battleOverlay} />

        <ScrollView
          contentContainerStyle={styles.battleScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.battleHeader}>
            <View>
              <Text style={styles.battleTopLabel}>GPS MONSTER HUNTER</Text>

              <Text style={styles.battleTitle}>BATTLE</Text>
            </View>

            <View style={styles.battleClassBox}>
              <Image
                source={activeClass.image}
                style={styles.battleClassImage}
                resizeMode="contain"
              />

              <View>
                <Text style={styles.battleClassLabel}>{activeClass.name}</Text>

                <Text style={styles.battleGearText}>
                  GEAR {equippedCount}/3
                </Text>
              </View>
            </View>
          </View>

          {/* MONSTER */}

          <View style={styles.monsterBattleCard}>
            <View
              style={[
                styles.monsterArtwork,

                {
                  backgroundColor: `${monster.color}18`,
                },

                monsterCharging && styles.chargingBorder,

                wolfFrenzy && styles.frenzyBorder,
              ]}
            >
              <Image
                source={monster.image}
                style={styles.battleMonsterImage}
                resizeMode="contain"
              />

              {monsterCharging && (
                <StateBadge text="CHARGING" color="#F2B64A" />
              )}

              {wolfFrenzy && <StateBadge text="FRENZY" color="#E94D64" />}

              {monster.id === 2 && slimeRevived && (
                <StateBadge text="REBORN" color="#26C6DA" />
              )}
            </View>

            <View style={styles.monsterBattleHeader}>
              <View>
                <Text style={styles.monsterBattleName}>{monster.name}</Text>

                <Text style={styles.monsterBattleLevel}>
                  MONSTER • LV.
                  {monster.level}
                </Text>
              </View>

              <Text
                style={[
                  styles.expReward,

                  {
                    color: monster.color,
                  },
                ]}
              >
                +{monster.exp} EXP
              </Text>
            </View>

            <View
              style={[
                styles.behaviorBox,

                {
                  borderColor: monster.color,
                },
              ]}
            >
              <Text
                style={[
                  styles.behaviorTitle,

                  {
                    color: monster.color,
                  },
                ]}
              >
                {monster.behaviorName}
              </Text>

              <Text style={styles.behaviorDescription}>
                {monster.behaviorDescription}
              </Text>
            </View>

            <StatusBar
              label="MONSTER HP"
              value={`${monsterHP}/${monster.maxHp}`}
              percentage={monsterHpPercentage}
              color={monster.color}
            />
          </View>

          {/* LOG */}

          <View style={styles.battleLog}>
            <Text style={styles.battleLogLabel}>BATTLE LOG</Text>

            <Text style={styles.battleLogText}>{battleMessage}</Text>
          </View>

          {/* PLAYER */}

          <View style={styles.playerBattleCard}>
            <View style={styles.playerBattleHeader}>
              <View
                style={[
                  styles.playerPortraitBox,

                  {
                    backgroundColor: `${activeClass.color}18`,
                  },
                ]}
              >
                <Image
                  source={activeClass.image}
                  style={styles.playerPortrait}
                  resizeMode="contain"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.playerBattleName}>{activeClass.name}</Text>

                <Text style={styles.playerBattleLevel}>
                  HUNTER • LV.
                  {playerLevel}
                </Text>
              </View>

              <View style={styles.attackStatBox}>
                <Text style={styles.attackStatLabel}>ATK</Text>

                <Text
                  style={[
                    styles.attackStatValue,

                    {
                      color: activeClass.color,
                    },
                  ]}
                >
                  {playerAttack}
                </Text>
              </View>
            </View>

            <StatusBar
              label="PLAYER HP"
              value={`${playerHP}/${playerMaxHP}`}
              percentage={playerHpPercentage}
              color="#59E391"
            />

            {playerMaxShield > 0 && (
              <View style={{ marginTop: 8 }}>
                <StatusBar
                  label="MAGIC SHIELD"
                  value={`${playerShield}/${playerMaxShield}`}
                  percentage={shieldPercentage}
                  color="#856AE8"
                />
              </View>
            )}

            <View style={styles.battleStatSummary}>
              <BattleMiniStat label="HP" value={`${playerMaxHP}`} />

              <BattleMiniStat label="ATK" value={`${playerAttack}`} />

              <BattleMiniStat
                label="DODGE"
                value={`${Math.round(dodgeChance * 100)}%`}
              />

              <BattleMiniStat label="GEAR" value={`${equippedCount}/3`} />
            </View>

            {activeClass.id === "mage" && (
              <View style={styles.castBox}>
                <Text style={styles.castText}>
                  NORMAL SPELL {attackActionProgress}/{attackActionCost} ACTIONS
                </Text>
              </View>
            )}

            {/* SKILLS */}

            <View style={styles.skillsSection}>
              <View style={styles.skillsHeader}>
                <Text style={styles.skillsTitle}>CLASS SKILLS</Text>

                <Text style={styles.skillsHint}>1 USE / BATTLE</Text>
              </View>

              <View style={styles.skillButtons}>
                {activeClass.skills.map((skill) => {
                  const available = isSkillAvailable(skill);

                  const unlocked = playerLevel >= skill.unlockLevel;

                  return (
                    <TouchableOpacity
                      key={skill.id}
                      disabled={!available}
                      onPress={() => useSkill(skill)}
                      style={[
                        styles.skillButton,

                        available && {
                          borderColor: activeClass.color,
                        },

                        !available && styles.disabledSkill,
                      ]}
                    >
                      <View
                        style={[
                          styles.skillIcon,

                          {
                            backgroundColor: available
                              ? activeClass.color
                              : "#3A4451",
                          },
                        ]}
                      >
                        <Text style={styles.skillIconText}>
                          {skill.shortName}
                        </Text>
                      </View>

                      <Text style={styles.skillName}>{skill.name}</Text>

                      <Text style={styles.skillDescription}>
                        {skill.description}
                      </Text>

                      <Text
                        style={[
                          styles.skillStatus,

                          available && {
                            color: activeClass.color,
                          },
                        ]}
                      >
                        {getSkillStatusText(skill)}
                      </Text>

                      {!unlocked && (
                        <View style={styles.lockBadge}>
                          <Text style={styles.lockText}>
                            LV.
                            {skill.unlockLevel}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* ATTACK */}

          <TouchableOpacity
            disabled={arcaneBurstCasting}
            onPress={attackMonster}
            style={[
              styles.attackButton,

              {
                backgroundColor: activeClass.color,

                opacity: arcaneBurstCasting ? 0.45 : 1,
              },
            ]}
          >
            <View>
              <Text style={styles.attackButtonSmall}>
                TOTAL ATK {playerAttack}
              </Text>

              <Text style={styles.attackButtonText}>
                {activeClass.id === "mage"
                  ? normalMageCasting
                    ? "CAST SPELL"
                    : "CHANT SPELL"
                  : "ATTACK"}
              </Text>
            </View>

            <Text style={styles.attackArrow}>›</Text>
          </TouchableOpacity>
        </ScrollView>
      </ImageBackground>
    );
  }

  // ====================================================
  // MAP SCREEN
  // ====================================================

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 13.7563,
          longitude: 100.5018,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsCompass
        showsBuildings
      >
        {playerLocation && (
          <>
            <Marker coordinate={playerLocation}>
              <View
                style={[
                  styles.mapPlayerMarker,

                  {
                    borderColor: activeClass.color,
                  },
                ]}
              >
                <Image
                  source={activeClass.image}
                  style={styles.mapPlayerImage}
                  resizeMode="contain"
                />
              </View>
            </Marker>

            <Circle
              center={playerLocation}
              radius={10}
              strokeWidth={2}
              strokeColor="rgba(36,111,255,0.65)"
              fillColor="rgba(36,111,255,0.10)"
            />
          </>
        )}

        {monsterLocation && monster && (
          <Marker coordinate={monsterLocation} onPress={selectMonster}>
            <View
              style={[
                styles.mapMonsterMarker,

                {
                  borderColor: monster.color,
                },
              ]}
            >
              <Image
                source={monster.image}
                style={styles.mapMonsterImage}
                resizeMode="contain"
              />
            </View>
          </Marker>
        )}
      </MapView>

      {/* HUD */}

      <View style={styles.topHud}>
        <View style={styles.hudProfile}>
          <View
            style={[
              styles.hudImageBox,

              {
                borderColor: activeClass.color,
              },
            ]}
          >
            <Image
              source={activeClass.image}
              style={styles.hudImage}
              resizeMode="contain"
            />
          </View>

          <View>
            <Text style={styles.hudClassName}>{activeClass.name}</Text>

            <Text style={styles.hudGps}>
              {locationStarted ? "● GPS CONNECTED" : "● GPS OFFLINE"}
            </Text>

            <Text style={styles.hudGearText}>GEAR {equippedCount}/3</Text>
          </View>
        </View>

        <View style={styles.hudProgress}>
          <View style={styles.hudProgressTop}>
            <Text style={styles.hudLevel}>LV.{playerLevel}</Text>

            <Text style={styles.hudStatsText}>
              HP {playerMaxHP} • ATK {playerAttack}
            </Text>
          </View>

          <View style={styles.hudExpHeader}>
            <Text style={styles.hudExpLabel}>EXP</Text>

            <Text style={styles.hudExpValue}>
              {exp}/{requiredExp}
            </Text>
          </View>

          <View style={styles.hudExpBackground}>
            <View
              style={[
                styles.hudExpBar,

                {
                  width: `${expPercentage}%`,

                  backgroundColor: activeClass.color,
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* START */}

      {!locationStarted && (
        <View style={styles.startOverlay}>
          <View style={styles.startCard}>
            <View style={styles.startPlayerRow}>
              <View
                style={[
                  styles.startImageBox,

                  {
                    backgroundColor: `${activeClass.color}20`,
                  },
                ]}
              >
                <Image
                  source={activeClass.image}
                  style={styles.startImage}
                  resizeMode="contain"
                />
              </View>

              <View>
                <Text style={styles.startSmall}>YOUR HUNTER</Text>

                <Text style={styles.startClassName}>{activeClass.name}</Text>

                <Text
                  style={[
                    styles.startClassRole,

                    {
                      color: activeClass.color,
                    },
                  ]}
                >
                  {activeClass.role}
                </Text>
              </View>
            </View>

            <Text style={styles.startDescription}>
              สามารถจัดอุปกรณ์ได้จากเมนู EQUIPMENT หลังเริ่ม Hunt
            </Text>

            <TouchableOpacity
              style={[
                styles.startButton,

                {
                  backgroundColor: activeClass.color,
                },
              ]}
              onPress={startHunt}
            >
              <Text style={styles.startButtonText}>START HUNT</Text>

              <Text style={styles.startArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* NEARBY */}

      {locationStarted && !selectedMonster && monster && distance !== null && (
        <View style={styles.nearbyCard}>
          <Image
            source={monster.image}
            style={styles.nearbyImage}
            resizeMode="contain"
          />

          <View style={{ flex: 1 }}>
            <Text style={styles.nearbyLabel}>MONSTER NEARBY</Text>

            <Text style={styles.nearbyName}>{monster.name}</Text>

            <Text
              style={[
                styles.nearbyBehavior,

                {
                  color: monster.color,
                },
              ]}
            >
              {monster.behaviorName}
            </Text>
          </View>

          <Text style={styles.nearbyDistance}>{distance.toFixed(1)}m</Text>
        </View>
      )}

      {/* DOCK */}

      {locationStarted && !selectedMonster && (
        <View style={styles.gameDock}>
          <DockButton
            icon="!"
            title="MISSIONS"
            subtitle={`${completedQuestCount}/${QUESTS.length}`}
            onPress={() => setQuestVisible(true)}
          />

          <DockButton
            icon="E"
            title="EQUIPMENT"
            subtitle={`${equippedCount}/3`}
            onPress={() => setEquipmentVisible(true)}
          />

          <TouchableOpacity
            style={styles.locationDock}
            onPress={goToMyLocation}
          >
            <View
              style={[
                styles.locationButton,

                {
                  backgroundColor: activeClass.color,
                },
              ]}
            >
              <Text style={styles.locationIcon}>◎</Text>
            </View>

            <Text style={styles.dockTitle}>LOCATION</Text>
          </TouchableOpacity>

          <DockButton
            icon="M"
            title="MONSTERS"
            subtitle={`${discoveredCount}/${MONSTERS.length}`}
            onPress={() => setCollectionVisible(true)}
          />
        </View>
      )}

      {/* MONSTER INFO */}

      {selectedMonster && monster && distance !== null && (
        <View style={styles.monsterInfoCard}>
          <View style={styles.monsterInfoTop}>
            <Image
              source={monster.image}
              style={styles.monsterInfoImage}
              resizeMode="contain"
            />

            <View style={{ flex: 1 }}>
              <Text style={styles.monsterInfoLabel}>MONSTER FOUND</Text>

              <Text style={styles.monsterInfoName}>{monster.name}</Text>

              <Text
                style={[
                  styles.monsterBehaviorName,

                  {
                    color: monster.color,
                  },
                ]}
              >
                {monster.behaviorName}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedMonster(false)}
            >
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.monsterInfoStats}>
            <InfoStat label="LEVEL" value={`${monster.level}`} />

            <InfoStat label="HP" value={`${monster.maxHp}`} />

            <InfoStat label="EXP" value={`+${monster.exp}`} />

            <InfoStat label="RANGE" value={`${distance.toFixed(1)}m`} />
          </View>

          <TouchableOpacity
            style={[
              styles.enterBattleButton,

              {
                backgroundColor: monster.color,
              },
            ]}
            onPress={enterBattle}
          >
            <Text style={styles.enterBattleText}>ENTER BATTLE</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* =================================================
          EQUIPMENT MODAL
      ================================================= */}

      <Modal
        visible={equipmentVisible}
        animationType="slide"
        onRequestClose={() => setEquipmentVisible(false)}
      >
        <View style={styles.menuScreen}>
          <MenuHeader
            title="EQUIPMENT"
            subtitle={`${activeClass.name} • ${equippedCount}/3 equipped`}
            onClose={() => setEquipmentVisible(false)}
          />

          <ScrollView
            contentContainerStyle={styles.menuScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* PLAYER SUMMARY */}

            <View
              style={[
                styles.equipmentHero,

                {
                  borderColor: activeClass.color,
                },
              ]}
            >
              <Image
                source={activeClass.image}
                style={styles.equipmentHeroImage}
                resizeMode="contain"
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.equipmentHeroClass}>
                  {activeClass.name}
                </Text>

                <Text style={styles.equipmentHeroLevel}>
                  LEVEL {playerLevel}
                </Text>

                <View style={styles.equipmentTotalStats}>
                  <EquipmentTotalStat label="HP" value={`${playerMaxHP}`} />

                  <EquipmentTotalStat label="ATK" value={`${playerAttack}`} />

                  <EquipmentTotalStat
                    label="DODGE"
                    value={`${Math.round(dodgeChance * 100)}%`}
                  />

                  <EquipmentTotalStat
                    label="SHIELD"
                    value={`${playerMaxShield}`}
                  />
                </View>
              </View>
            </View>

            {/* CURRENT SLOTS */}

            <Text style={styles.equipmentSectionTitle}>EQUIPPED</Text>

            {(["weapon", "armor", "accessory"] as EquipmentSlot[]).map(
              (slot) => {
                const equipped = getEquippedItem(slot);

                return (
                  <View key={slot} style={styles.equipmentSlot}>
                    <View style={styles.slotLabelBox}>
                      <Text style={styles.slotLabel}>{slot.toUpperCase()}</Text>
                    </View>

                    {equipped ? (
                      <>
                        <Image
                          source={equipped.image}
                          style={styles.slotImage}
                          resizeMode="contain"
                        />

                        <View
                          style={{
                            flex: 1,
                          }}
                        >
                          <Text style={styles.slotItemName}>
                            {equipped.name}
                          </Text>

                          <Text
                            style={[
                              styles.slotBonus,

                              {
                                color: activeClass.color,
                              },
                            ]}
                          >
                            {getEquipmentBonusText(equipped)}
                          </Text>
                        </View>
                      </>
                    ) : (
                      <Text style={styles.emptySlot}>EMPTY SLOT</Text>
                    )}
                  </View>
                );
              },
            )}

            {/* AVAILABLE ITEMS */}

            <Text style={styles.equipmentSectionTitle}>
              AVAILABLE EQUIPMENT
            </Text>

            {classEquipment.map((item) => {
              const equipped = equippedItems[item.slot] === item.id;

              return (
                <View
                  key={item.id}
                  style={[
                    styles.equipmentCard,

                    equipped && {
                      borderColor: activeClass.color,

                      borderWidth: 2,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.equipmentImageBox,

                      {
                        backgroundColor: `${activeClass.color}12`,
                      },
                    ]}
                  >
                    <Image
                      source={item.image}
                      style={styles.equipmentImage}
                      resizeMode="contain"
                    />
                  </View>

                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <Text style={styles.equipmentSlotLabel}>
                      {item.slot.toUpperCase()}
                    </Text>

                    <Text style={styles.equipmentName}>{item.name}</Text>

                    <Text style={styles.equipmentDescription}>
                      {item.description}
                    </Text>

                    <Text
                      style={[
                        styles.equipmentBonus,

                        {
                          color: activeClass.color,
                        },
                      ]}
                    >
                      {getEquipmentBonusText(item)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.equipButton,

                      {
                        backgroundColor: equipped
                          ? "#303842"
                          : activeClass.color,
                      },
                    ]}
                    onPress={() => equipItem(item)}
                  >
                    <Text style={styles.equipButtonText}>
                      {equipped ? "REMOVE" : "EQUIP"}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}

            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* =================================================
          LEVEL UP
      ================================================= */}

      <Modal visible={levelUpVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.levelUpCard}>
            <Image
              source={activeClass.image}
              style={styles.levelUpImage}
              resizeMode="contain"
            />

            <Text style={styles.levelUpTitle}>LEVEL UP!</Text>

            <Text style={styles.levelChangeText}>
              LV.{oldLevel} → LV.
              {newLevel}
            </Text>

            <View style={styles.levelStatsBox}>
              <Text style={styles.levelStat}>
                HP{" "}
                {getBasePlayerMaxHP(oldLevel, activeClass) +
                  equipmentBonuses.hp}{" "}
                →{" "}
                {getBasePlayerMaxHP(newLevel, activeClass) +
                  equipmentBonuses.hp}
              </Text>

              <Text style={styles.levelStat}>
                ATK{" "}
                {getBasePlayerAttack(oldLevel, activeClass) +
                  equipmentBonuses.attack}{" "}
                →{" "}
                {getBasePlayerAttack(newLevel, activeClass) +
                  equipmentBonuses.attack}
              </Text>
            </View>

            {newUnlockedSkills.length > 0 && (
              <View style={styles.newSkillBox}>
                <Text style={styles.newSkillLabel}>NEW SKILL UNLOCKED</Text>

                {newUnlockedSkills.map((skill) => (
                  <Text
                    key={skill.id}
                    style={[
                      styles.newSkillName,

                      {
                        color: activeClass.color,
                      },
                    ]}
                  >
                    {skill.name}
                  </Text>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.levelContinue,

                {
                  backgroundColor: activeClass.color,
                },
              ]}
              onPress={() => setLevelUpVisible(false)}
            >
              <Text style={styles.levelContinueText}>CONTINUE HUNT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* =================================================
          MISSIONS
      ================================================= */}

      <Modal
        visible={questVisible}
        animationType="slide"
        onRequestClose={() => setQuestVisible(false)}
      >
        <View style={styles.menuScreen}>
          <MenuHeader
            title="MISSIONS"
            subtitle="Complete objectives and earn EXP"
            onClose={() => setQuestVisible(false)}
          />

          <ScrollView contentContainerStyle={styles.menuScroll}>
            {QUESTS.map((quest) => {
              const progress = getQuestProgress(quest);

              const complete = isQuestComplete(quest);

              const claimed = claimedQuests[quest.id] ?? false;

              return (
                <View key={quest.id} style={styles.questCard}>
                  <Text style={styles.questTitle}>{quest.title}</Text>

                  <Text style={styles.questDescription}>
                    {quest.description}
                  </Text>

                  <Text style={styles.questProgress}>
                    {progress}/{quest.target}
                  </Text>

                  <Text style={styles.questReward}>+{quest.rewardExp} EXP</Text>

                  {claimed ? (
                    <Text style={styles.claimedText}>CLAIMED</Text>
                  ) : complete ? (
                    <TouchableOpacity
                      style={[
                        styles.claimButton,

                        {
                          backgroundColor: activeClass.color,
                        },
                      ]}
                      onPress={() => claimQuestReward(quest)}
                    >
                      <Text style={styles.claimText}>CLAIM</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.inProgressText}>IN PROGRESS</Text>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      {/* =================================================
          COLLECTION
      ================================================= */}

      <Modal
        visible={collectionVisible}
        animationType="slide"
        onRequestClose={() => setCollectionVisible(false)}
      >
        <View style={styles.menuScreen}>
          <MenuHeader
            title="COLLECTION"
            subtitle={`${discoveredCount}/${MONSTERS.length} Monsters discovered`}
            onClose={() => setCollectionVisible(false)}
          />

          <ScrollView contentContainerStyle={styles.menuScroll}>
            {MONSTERS.map((item) => {
              const data = monsterCollection[item.id];

              if (!data?.discovered) {
                return (
                  <View key={item.id} style={styles.collectionCard}>
                    <View style={styles.unknownMonster}>
                      <Text style={styles.unknownMonsterText}>?</Text>
                    </View>

                    <Text style={styles.collectionName}>UNKNOWN MONSTER</Text>
                  </View>
                );
              }

              return (
                <View key={item.id} style={styles.collectionCard}>
                  <Image
                    source={item.image}
                    style={styles.collectionImage}
                    resizeMode="contain"
                  />

                  <View style={{ flex: 1 }}>
                    <Text style={styles.collectionName}>{item.name}</Text>

                    <Text
                      style={[
                        styles.collectionBehavior,

                        {
                          color: item.color,
                        },
                      ]}
                    >
                      {item.behaviorName}
                    </Text>

                    <Text style={styles.collectionDescription}>
                      {item.behaviorDescription}
                    </Text>

                    <Text style={styles.collectionKills}>
                      DEFEATED {data.defeated} TIMES
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ======================================================
// COMPONENTS
// ======================================================

function ClassStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.classStat}>
      <Text style={styles.classStatLabel}>{label}</Text>

      <Text style={styles.classStatValue}>{value}</Text>
    </View>
  );
}

function InfoStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoStat}>
      <Text style={styles.infoStatLabel}>{label}</Text>

      <Text style={styles.infoStatValue}>{value}</Text>
    </View>
  );
}

function StatusBar({
  label,
  value,
  percentage,
  color,
}: {
  label: string;
  value: string;
  percentage: number;
  color: string;
}) {
  return (
    <View>
      <View style={styles.statusBarHeader}>
        <Text style={styles.statusBarLabel}>{label}</Text>

        <Text style={styles.statusBarValue}>{value}</Text>
      </View>

      <View style={styles.statusBarBackground}>
        <View
          style={{
            width: `${Math.max(0, Math.min(percentage, 100))}%`,

            height: "100%",

            borderRadius: 8,

            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}

function BattleMiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.battleMiniStat}>
      <Text style={styles.battleMiniLabel}>{label}</Text>

      <Text style={styles.battleMiniValue}>{value}</Text>
    </View>
  );
}

function EquipmentTotalStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.equipmentTotalStat}>
      <Text style={styles.equipmentTotalLabel}>{label}</Text>

      <Text style={styles.equipmentTotalValue}>{value}</Text>
    </View>
  );
}

function StateBadge({ text, color }: { text: string; color: string }) {
  return (
    <View
      style={[
        styles.stateBadge,

        {
          backgroundColor: color,
        },
      ]}
    >
      <Text style={styles.stateBadgeText}>{text}</Text>
    </View>
  );
}

function DockButton({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.dockButton} onPress={onPress}>
      <Text style={styles.dockIcon}>{icon}</Text>

      <Text style={styles.dockTitle}>{title}</Text>

      <Text style={styles.dockSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

function MenuHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
}) {
  return (
    <View style={styles.menuHeader}>
      <View>
        <Text style={styles.menuTopLabel}>GPS MONSTER HUNTER</Text>

        <Text style={styles.menuTitle}>{title}</Text>

        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>

      <TouchableOpacity style={styles.menuClose} onPress={onClose}>
        <Text style={styles.menuCloseText}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

// ======================================================
// STYLES
// ======================================================
const styles = StyleSheet.create({
  // ====================================================
  // GLOBAL
  // ====================================================

  container: {
    flex: 1,

    width: "100%",

    height: "100%",

    overflow: "hidden",

    backgroundColor: "#070C13",
  },

  map: {
    flex: 1,
  },

  classBackground: {
    flex: 1,

    width: "100%",

    height: "100%",

    overflow: "hidden",
  },

  battleBackground: {
    flex: 1,

    width: "100%",

    height: "100%",

    overflow: "hidden",
  },

  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7,12,19,0.82)",
  },

  battleOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(6,10,16,0.88)",
  },

  // ====================================================
  // CLASS SELECT
  // ====================================================

  classScreen: {
    flex: 1,
    paddingTop: 50,
  },

  classHeader: {
    paddingHorizontal: 20,
    paddingBottom: 18,
  },

  classTopLabel: {
    color: "#84909E",
    fontSize: 11,
    fontWeight: "900",
  },

  classTitle: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
    marginTop: 4,
  },

  classSubtitle: {
    color: "#B0BAC5",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },

  classList: {
    paddingHorizontal: 15,
  },

  classCard: {
    minHeight: 240,
    backgroundColor: "rgba(20,29,40,0.94)",
    borderRadius: 22,
    padding: 13,
    marginBottom: 14,
    flexDirection: "row",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.06)",
  },

  classImageArea: {
    width: 120,
    borderRadius: 18,
    justifyContent: "flex-end",
    alignItems: "center",
    overflow: "hidden",
    marginRight: 13,
  },

  classImage: {
    width: 118,
    height: 220,
  },

  classInformation: {
    flex: 1,
    paddingVertical: 4,
  },

  classNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  className: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
  },

  classRole: {
    fontSize: 11,
    fontWeight: "900",
    marginTop: 3,
  },

  selectedBadge: {
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 7,
  },

  selectedBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },

  classDescription: {
    color: "#AAB4BF",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },

  classStats: {
    flexDirection: "row",
    marginTop: 10,
  },

  classStat: {
    flex: 1,
    backgroundColor: "#202A37",
    borderRadius: 9,
    alignItems: "center",
    paddingVertical: 8,
    marginRight: 5,
  },

  classStatLabel: {
    color: "#85909D",
    fontSize: 9,
    fontWeight: "900",
  },

  classStatValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 2,
  },

  skillPathBox: {
    marginTop: 10,
    backgroundColor: "#202936",
    borderRadius: 10,
    padding: 9,
  },

  skillPathTitle: {
    color: "#8793A0",
    fontSize: 9,
    fontWeight: "900",
    marginBottom: 5,
  },

  skillPathText: {
    color: "#D0D6DD",
    fontSize: 11,
    fontWeight: "800",
    marginVertical: 3,
  },

  confirmClassButton: {
    minHeight: 72,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  confirmSmall: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 10,
    fontWeight: "900",
  },

  confirmName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 2,
  },

  confirmArrow: {
    marginLeft: "auto",
    color: "#FFFFFF",
    fontSize: 36,
  },

  // ====================================================
  // MAP MARKERS
  // ====================================================

  mapPlayerMarker: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    overflow: "hidden",
    justifyContent: "flex-end",
    alignItems: "center",
  },

  mapPlayerImage: {
    width: 45,
    height: 50,
  },

  mapMonsterMarker: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 3,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  mapMonsterImage: {
    width: 52,
    height: 52,
  },

  // ====================================================
  // HUD
  // ====================================================

  topHud: {
    position: "absolute",
    top: 45,
    left: 12,
    right: 12,
    backgroundColor: "rgba(12,18,28,0.97)",
    borderRadius: 20,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 10,
  },

  hudProfile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  hudImageBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: "#202A37",
    overflow: "hidden",
    marginRight: 10,
    justifyContent: "flex-end",
    alignItems: "center",
  },

  hudImage: {
    width: 48,
    height: 56,
  },

  hudClassName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  hudGps: {
    color: "#59E391",
    fontSize: 9,
    fontWeight: "800",
    marginTop: 2,
  },

  hudGearText: {
    color: "#A0ABB7",
    fontSize: 9,
    fontWeight: "800",
    marginTop: 2,
  },

  hudProgress: {
    width: 155,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 10,
  },

  hudProgressTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  hudLevel: {
    color: "#111722",
    fontSize: 17,
    fontWeight: "900",
  },

  hudStatsText: {
    color: "#59636F",
    fontSize: 10,
    fontWeight: "800",
  },

  hudExpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },

  hudExpLabel: {
    color: "#7E8995",
    fontSize: 9,
    fontWeight: "900",
  },

  hudExpValue: {
    color: "#59636F",
    fontSize: 9,
    fontWeight: "800",
  },

  hudExpBackground: {
    height: 7,
    borderRadius: 7,
    backgroundColor: "#E4E7EB",
    marginTop: 5,
    overflow: "hidden",
  },

  hudExpBar: {
    height: "100%",
  },

  // ====================================================
  // START
  // ====================================================

  startOverlay: {
    position: "absolute",
    left: 15,
    right: 15,
    bottom: 25,
  },

  startCard: {
    backgroundColor: "#101621",
    borderRadius: 24,
    padding: 20,
    elevation: 12,
  },

  startPlayerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  startImageBox: {
    width: 92,
    height: 110,
    borderRadius: 18,
    overflow: "hidden",
    justifyContent: "flex-end",
    alignItems: "center",
    marginRight: 15,
  },

  startImage: {
    width: 90,
    height: 115,
  },

  startSmall: {
    color: "#8B97A4",
    fontSize: 10,
    fontWeight: "900",
  },

  startClassName: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "900",
    marginTop: 2,
  },

  startClassRole: {
    fontSize: 11,
    fontWeight: "900",
    marginTop: 3,
  },

  startDescription: {
    color: "#ADB6C0",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
  },

  startButton: {
    minHeight: 64,
    marginTop: 16,
    borderRadius: 16,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
  },

  startButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    flex: 1,
  },

  startArrow: {
    color: "#FFFFFF",
    fontSize: 34,
  },

  // ====================================================
  // NEARBY
  // ====================================================

  nearbyCard: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 120,
    borderRadius: 18,
    padding: 11,
    backgroundColor: "rgba(15,21,31,0.97)",
    flexDirection: "row",
    alignItems: "center",
  },

  nearbyImage: {
    width: 58,
    height: 58,
    marginRight: 11,
  },

  nearbyLabel: {
    color: "#8E99A6",
    fontSize: 9,
    fontWeight: "900",
  },

  nearbyName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 2,
  },

  nearbyBehavior: {
    fontSize: 10,
    fontWeight: "900",
    marginTop: 2,
  },

  nearbyDistance: {
    color: "#59E391",
    fontSize: 17,
    fontWeight: "900",
  },

  // ====================================================
  // DOCK
  // ====================================================

  gameDock: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 12,
    height: 96,
    backgroundColor: "#101621",
    borderRadius: 22,
    flexDirection: "row",
    paddingHorizontal: 4,
    elevation: 12,
  },

  dockButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 2,
  },

  locationDock: {
    flex: 1,
    alignItems: "center",
    marginTop: -10,
  },

  dockIcon: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: "#202A37",
    textAlign: "center",
    textAlignVertical: "center",
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  dockTitle: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    marginTop: 5,
  },

  dockSubtitle: {
    color: "#8D98A5",
    fontSize: 8,
    fontWeight: "700",
    marginTop: 2,
  },

  locationButton: {
    width: 58,
    height: 58,
    borderRadius: 19,
    borderWidth: 5,
    borderColor: "#101621",
    justifyContent: "center",
    alignItems: "center",
  },

  locationIcon: {
    color: "#FFFFFF",
    fontSize: 29,
    fontWeight: "900",
  },

  // ====================================================
  // MONSTER INFO
  // ====================================================

  monsterInfoCard: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 15,
    borderRadius: 24,
    padding: 18,
    backgroundColor: "#FFFFFF",
    elevation: 12,
  },

  monsterInfoTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  monsterInfoImage: {
    width: 86,
    height: 86,
    marginRight: 13,
  },

  monsterInfoLabel: {
    color: "#8B96A2",
    fontSize: 10,
    fontWeight: "900",
  },

  monsterInfoName: {
    color: "#111722",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 2,
  },

  monsterBehaviorName: {
    fontSize: 11,
    fontWeight: "900",
    marginTop: 4,
  },

  closeButton: {
    width: 38,
    height: 38,
    backgroundColor: "#EEF0F3",
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },

  closeText: {
    color: "#66717D",
    fontSize: 25,
  },

  monsterInfoStats: {
    flexDirection: "row",
    marginVertical: 15,
  },

  infoStat: {
    flex: 1,
    backgroundColor: "#F2F4F6",
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: "center",
    marginRight: 5,
  },

  infoStatLabel: {
    color: "#85909C",
    fontSize: 9,
    fontWeight: "900",
  },

  infoStatValue: {
    color: "#111722",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 2,
  },

  enterBattleButton: {
    minHeight: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  enterBattleText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  // ====================================================
  // BATTLE
  // ====================================================

  battleScroll: {
    paddingHorizontal: 16,
    paddingTop: 45,
    paddingBottom: 35,
  },

  battleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 13,
  },

  battleTopLabel: {
    color: "#8B96A3",
    fontSize: 10,
    fontWeight: "900",
  },

  battleTitle: {
    color: "#FFFFFF",
    fontSize: 31,
    fontWeight: "900",
  },

  battleClassBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(22,30,42,0.95)",
    borderRadius: 14,
    padding: 8,
  },

  battleClassImage: {
    width: 45,
    height: 51,
    marginRight: 7,
  },

  battleClassLabel: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  battleGearText: {
    color: "#95A0AC",
    fontSize: 9,
    fontWeight: "800",
    marginTop: 2,
  },

  monsterBattleCard: {
    backgroundColor: "rgba(19,27,39,0.96)",
    borderRadius: 22,
    padding: 15,
  },

  monsterArtwork: {
    height: 170,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  chargingBorder: {
    borderWidth: 2,
    borderColor: "#F2B64A",
  },

  frenzyBorder: {
    borderWidth: 2,
    borderColor: "#E94D64",
  },

  battleMonsterImage: {
    width: 165,
    height: 165,
  },

  stateBadge: {
    position: "absolute",
    top: 9,
    right: 9,
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  stateBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },

  monsterBattleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 11,
  },

  monsterBattleName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },

  monsterBattleLevel: {
    color: "#929DA9",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 2,
  },

  expReward: {
    fontSize: 11,
    fontWeight: "900",
  },

  behaviorBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },

  behaviorTitle: {
    fontSize: 11,
    fontWeight: "900",
  },

  behaviorDescription: {
    color: "#A7B0BA",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },

  // ====================================================
  // STATUS BAR
  // ====================================================

  statusBarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  statusBarLabel: {
    color: "#A0AAB6",
    fontSize: 10,
    fontWeight: "900",
  },

  statusBarValue: {
    color: "#D1D6DC",
    fontSize: 11,
    fontWeight: "800",
  },

  statusBarBackground: {
    height: 11,
    backgroundColor: "#2A3442",
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 6,
  },

  // ====================================================
  // BATTLE LOG
  // ====================================================

  battleLog: {
    backgroundColor: "rgba(17,24,34,0.97)",
    borderRadius: 12,
    padding: 12,
    marginVertical: 9,
  },

  battleLogLabel: {
    color: "#818D9A",
    fontSize: 10,
    fontWeight: "900",
  },

  battleLogText: {
    color: "#D2D7DE",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    marginTop: 4,
  },

  // ====================================================
  // PLAYER BATTLE
  // ====================================================

  playerBattleCard: {
    backgroundColor: "rgba(19,27,39,0.96)",
    borderRadius: 20,
    padding: 15,
  },

  playerBattleHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  playerPortraitBox: {
    width: 76,
    height: 82,
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "flex-end",
    alignItems: "center",
    marginRight: 11,
  },

  playerPortrait: {
    width: 73,
    height: 86,
  },

  playerBattleName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  playerBattleLevel: {
    color: "#929DA9",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 2,
  },

  attackStatBox: {
    backgroundColor: "#202A37",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
  },

  attackStatLabel: {
    color: "#8995A2",
    fontSize: 9,
    fontWeight: "900",
  },

  attackStatValue: {
    fontSize: 17,
    fontWeight: "900",
  },

  battleStatSummary: {
    flexDirection: "row",
    marginTop: 11,
  },

  battleMiniStat: {
    flex: 1,
    backgroundColor: "#202936",
    borderRadius: 9,
    paddingVertical: 8,
    alignItems: "center",
    marginRight: 5,
  },

  battleMiniLabel: {
    color: "#84909D",
    fontSize: 9,
    fontWeight: "900",
  },

  battleMiniValue: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 2,
  },

  castBox: {
    backgroundColor: "#202936",
    borderRadius: 9,
    padding: 10,
    marginTop: 9,
  },

  castText: {
    color: "#B5A4FF",
    fontSize: 11,
    fontWeight: "900",
  },

  // ====================================================
  // SKILLS
  // ====================================================

  skillsSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#293440",
  },

  skillsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 9,
  },

  skillsTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  skillsHint: {
    color: "#8C97A4",
    fontSize: 9,
    fontWeight: "800",
  },

  skillButtons: {
    flexDirection: "row",
  },

  skillButton: {
    flex: 1,
    minHeight: 175,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#3A4552",
    backgroundColor: "#202936",
    padding: 11,
    marginRight: 7,
    position: "relative",
  },

  disabledSkill: {
    opacity: 0.48,
  },

  skillIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },

  skillIconText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  skillName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 9,
  },

  skillDescription: {
    color: "#A7B1BC",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 5,
  },

  skillStatus: {
    fontSize: 10,
    fontWeight: "900",
    marginTop: 10,
  },

  lockBadge: {
    position: "absolute",
    right: 7,
    top: 7,
    backgroundColor: "#111821",
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },

  lockText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },

  attackButton: {
    minHeight: 72,
    borderRadius: 18,
    paddingHorizontal: 19,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },

  attackButtonSmall: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 10,
    fontWeight: "900",
  },

  attackButtonText: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
    marginTop: 1,
  },

  attackArrow: {
    color: "#FFFFFF",
    fontSize: 38,
    marginLeft: "auto",
  },

  // ====================================================
  // MENU GENERAL
  // ====================================================

  menuScreen: {
    flex: 1,
    backgroundColor: "#F0F3F6",
    paddingTop: 48,
  },

  menuHeader: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  menuTopLabel: {
    color: "#89939F",
    fontSize: 10,
    fontWeight: "900",
  },

  menuTitle: {
    color: "#111722",
    fontSize: 30,
    fontWeight: "900",
  },

  menuSubtitle: {
    color: "#717C88",
    fontSize: 12,
    marginTop: 3,
  },

  menuClose: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#111722",
    justifyContent: "center",
    alignItems: "center",
  },

  menuCloseText: {
    color: "#FFFFFF",
    fontSize: 27,
  },

  menuScroll: {
    paddingHorizontal: 18,
    paddingBottom: 35,
  },

  // ====================================================
  // EQUIPMENT
  // ====================================================

  equipmentHero: {
    backgroundColor: "#111722",
    borderRadius: 20,
    padding: 15,
    flexDirection: "row",
    borderWidth: 2,
    marginBottom: 20,
  },

  equipmentHeroImage: {
    width: 100,
    height: 130,
    marginRight: 13,
  },

  equipmentHeroClass: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
  },

  equipmentHeroLevel: {
    color: "#9BA5B1",
    fontSize: 11,
    fontWeight: "900",
    marginTop: 2,
  },

  equipmentTotalStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 11,
  },

  equipmentTotalStat: {
    width: "48%",
    backgroundColor: "#202936",
    borderRadius: 9,
    paddingVertical: 8,
    alignItems: "center",
    marginRight: 5,
    marginBottom: 5,
  },

  equipmentTotalLabel: {
    color: "#8F9AA7",
    fontSize: 9,
    fontWeight: "900",
  },

  equipmentTotalValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 2,
  },

  equipmentSectionTitle: {
    color: "#56616D",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 9,
    marginTop: 4,
  },

  equipmentSlot: {
    minHeight: 82,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 11,
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
  },

  slotLabelBox: {
    width: 76,
  },

  slotLabel: {
    color: "#818C98",
    fontSize: 10,
    fontWeight: "900",
  },

  slotImage: {
    width: 55,
    height: 55,
    marginRight: 11,
  },

  slotItemName: {
    color: "#111722",
    fontSize: 14,
    fontWeight: "900",
  },

  slotBonus: {
    fontSize: 11,
    fontWeight: "900",
    marginTop: 4,
  },

  emptySlot: {
    color: "#909AA6",
    fontSize: 12,
    fontWeight: "800",
  },

  equipmentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 13,
    marginBottom: 11,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },

  equipmentImageBox: {
    width: 82,
    height: 82,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  equipmentImage: {
    width: 72,
    height: 72,
  },

  equipmentSlotLabel: {
    color: "#828D99",
    fontSize: 9,
    fontWeight: "900",
  },

  equipmentName: {
    color: "#111722",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 2,
  },

  equipmentDescription: {
    color: "#717C87",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },

  equipmentBonus: {
    fontSize: 11,
    fontWeight: "900",
    marginTop: 6,
  },

  equipButton: {
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginLeft: 8,
  },

  equipButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },

  // ====================================================
  // LEVEL UP
  // ====================================================

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(5,9,15,0.84)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  levelUpCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    padding: 22,
    alignItems: "center",
  },

  levelUpImage: {
    width: 105,
    height: 135,
  },

  levelUpTitle: {
    color: "#111722",
    fontSize: 31,
    fontWeight: "900",
  },

  levelChangeText: {
    color: "#5E6874",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 6,
  },

  levelStatsBox: {
    width: "100%",
    backgroundColor: "#F3F5F7",
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
  },

  levelStat: {
    color: "#46515D",
    fontSize: 13,
    fontWeight: "900",
    marginVertical: 4,
  },

  newSkillBox: {
    width: "100%",
    backgroundColor: "#F7F8FA",
    borderRadius: 14,
    padding: 13,
    marginTop: 11,
  },

  newSkillLabel: {
    color: "#707B87",
    fontSize: 10,
    fontWeight: "900",
  },

  newSkillName: {
    fontSize: 16,
    fontWeight: "900",
    marginTop: 5,
  },

  levelContinue: {
    width: "100%",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 18,
  },

  levelContinueText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  // ====================================================
  // QUEST
  // ====================================================

  questCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },

  questTitle: {
    color: "#111722",
    fontSize: 17,
    fontWeight: "900",
  },

  questDescription: {
    color: "#717C88",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },

  questProgress: {
    color: "#505B67",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 11,
  },

  questReward: {
    color: "#111722",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 6,
  },

  claimButton: {
    alignSelf: "flex-end",
    borderRadius: 9,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 8,
  },

  claimText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  claimedText: {
    color: "#249E59",
    fontSize: 11,
    fontWeight: "900",
    marginTop: 8,
  },

  inProgressText: {
    color: "#7B8692",
    fontSize: 11,
    fontWeight: "900",
    marginTop: 8,
  },

  // ====================================================
  // COLLECTION
  // ====================================================

  collectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "center",
  },

  collectionImage: {
    width: 90,
    height: 90,
    marginRight: 13,
  },

  unknownMonster: {
    width: 90,
    height: 90,
    borderRadius: 20,
    backgroundColor: "#E0E4E8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },

  unknownMonsterText: {
    color: "#818C98",
    fontSize: 38,
    fontWeight: "900",
  },

  collectionName: {
    color: "#111722",
    fontSize: 17,
    fontWeight: "900",
  },

  collectionBehavior: {
    fontSize: 11,
    fontWeight: "900",
    marginTop: 4,
  },

  collectionDescription: {
    color: "#717C87",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },

  collectionKills: {
    color: "#4C5763",
    fontSize: 11,
    fontWeight: "900",
    marginTop: 8,
  },
});
