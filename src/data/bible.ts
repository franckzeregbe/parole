export type VersionId = 'dar' | 'lsg' | 'kjv';

export const VERSIONS: Record<VersionId, string> = {
  dar: 'Darby',
  lsg: 'Segond',
  kjv: 'KJV',
};

export const VLABEL: Record<VersionId, string> = {
  dar: 'Darby (Français)',
  lsg: 'Louis Segond (Français)',
  kjv: 'King James (English)',
};

export const VLANG: Record<VersionId, string> = {
  dar: 'fr-FR',
  lsg: 'fr-FR',
  kjv: 'en-US',
};

export interface Chapter {
  name: string;
  chapter: number;
  sub: string;
  verseStart: number;
  text: Record<VersionId, string[]>;
}

export interface BookMeta {
  id: string;
  name: string;
  chap: number | null;
  testament: 'Ancien Testament' | 'Nouveau Testament';
}

export const ALL_BOOKS: BookMeta[] = [
  { id: 'gen', name: 'Genèse', chap: 1, testament: 'Ancien Testament' },
  { id: 'ps', name: 'Psaumes', chap: 23, testament: 'Ancien Testament' },
  { id: 'jean', name: 'Jean', chap: 3, testament: 'Nouveau Testament' },
  { id: 'ex', name: 'Exode', chap: null, testament: 'Ancien Testament' },
  { id: 'mat', name: 'Matthieu', chap: null, testament: 'Nouveau Testament' },
  { id: 'rom', name: 'Romains', chap: null, testament: 'Nouveau Testament' },
  { id: 'apo', name: 'Apocalypse', chap: null, testament: 'Nouveau Testament' },
];

export const ORDER = ['gen', 'ps', 'jean'];

export const BIBLE: Record<string, Chapter> = {
  gen: {
    name: 'Genèse', chapter: 1, sub: 'La création', verseStart: 1,
    text: {
      dar: [
        'Au commencement Dieu créa les cieux et la terre.',
        "Et la terre était désolation et vide, et il y avait des ténèbres sur la face de l'abîme. Et l'Esprit de Dieu planait sur la face des eaux.",
        'Et Dieu dit: Que la lumière soit. Et la lumière fut.',
        "Et Dieu vit la lumière, qu'elle était bonne; et Dieu sépara la lumière d'avec les ténèbres.",
        'Et Dieu appela la lumière Jour; et les ténèbres, il les appela Nuit. Et il y eut soir, et il y eut matin: le premier jour.',
      ],
      lsg: [
        'Au commencement, Dieu créa les cieux et la terre.',
        "La terre était informe et vide: il y avait des ténèbres à la surface de l'abîme, et l'esprit de Dieu se mouvait au-dessus des eaux.",
        'Dieu dit: Que la lumière soit! Et la lumière fut.',
        "Dieu vit que la lumière était bonne; et Dieu sépara la lumière d'avec les ténèbres.",
        'Dieu appela la lumière jour, et il appela les ténèbres nuit. Ainsi, il y eut un soir, et il y eut un matin: ce fut le premier jour.',
      ],
      kjv: [
        'In the beginning God created the heaven and the earth.',
        'And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.',
        'And God said, Let there be light: and there was light.',
        'And God saw the light, that it was good: and God divided the light from the darkness.',
        'And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day.',
      ],
    },
  },
  ps: {
    name: 'Psaumes', chapter: 23, sub: 'Le Seigneur est mon berger', verseStart: 1,
    text: {
      dar: [
        "L'Éternel est mon berger: je ne manquerai de rien.",
        'Il me fait reposer dans de verts pâturages, il me mène à des eaux paisibles.',
        'Il restaure mon âme; il me conduit dans des sentiers de justice, à cause de son nom.',
        "Même quand je marcherais par la vallée de l'ombre de la mort, je ne craindrai aucun mal; car tu es avec moi: ta houlette et ton bâton, ce sont eux qui me consolent.",
        "Tu dresses devant moi une table, en la présence de mes ennemis; tu as oint ma tête d'huile, ma coupe est comble.",
        "Oui, la bonté et la gratuité me suivront tous les jours de ma vie, et mon habitation sera dans la maison de l'Éternel pour de longs jours.",
      ],
      lsg: [
        "L'Éternel est mon berger: je ne manquerai de rien.",
        'Il me fait reposer dans de verts pâturages, il me dirige près des eaux paisibles.',
        'Il restaure mon âme, il me conduit dans les sentiers de la justice, à cause de son nom.',
        "Quand je marche dans la vallée de l'ombre de la mort, je ne crains aucun mal, car tu es avec moi: ta houlette et ton bâton me rassurent.",
        "Tu dresses devant moi une table, en face de mes adversaires; tu oins d'huile ma tête, et ma coupe déborde.",
        "Oui, le bonheur et la grâce m'accompagneront tous les jours de ma vie, et j'habiterai dans la maison de l'Éternel jusqu'à la fin de mes jours.",
      ],
      kjv: [
        'The LORD is my shepherd; I shall not want.',
        'He maketh me to lie down in green pastures: he leadeth me beside the still waters.',
        "He restoreth my soul: he leadeth me in the paths of righteousness for his name's sake.",
        'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.',
        'Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over.',
        'Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever.',
      ],
    },
  },
  jean: {
    name: 'Jean', chapter: 3, sub: "L'amour de Dieu", verseStart: 16,
    text: {
      dar: [
        "Car Dieu a tant aimé le monde, qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse pas, mais qu'il ait la vie éternelle.",
        "Car Dieu n'a pas envoyé son Fils dans le monde afin qu'il jugeât le monde, mais afin que le monde fût sauvé par lui.",
        "Celui qui croit en lui n'est pas jugé, mais celui qui ne croit pas est déjà jugé, parce qu'il n'a pas cru au nom du Fils unique de Dieu.",
      ],
      lsg: [
        "Car Dieu a tant aimé le monde qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu'il ait la vie éternelle.",
        "Dieu, en effet, n'a pas envoyé son Fils dans le monde pour qu'il juge le monde, mais pour que le monde soit sauvé par lui.",
        "Celui qui croit en lui n'est point jugé; mais celui qui ne croit pas est déjà jugé, parce qu'il n'a pas cru au nom du Fils unique de Dieu.",
      ],
      kjv: [
        'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
        'For God sent not his Son into the world to condemn the world; but that the world through him might be saved.',
        'He that believeth on him is not condemned: but he that believeth not is condemned already, because he hath not believed in the name of the only begotten Son of God.',
      ],
    },
  },
};
