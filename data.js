let COURSE = {
  title: "Tecnologia · 1r ESO",
  year: "2026–27",
  blocks: [
    {
      id: "b1", number: "01", title: "La tecnologia i el procés tecnològic", hours: "20 h",
      description: "De les necessitats humanes a la solució: procés tecnològic, impacte ambiental, eines i unitats.",
      topics: [
        {id:"cover", code:"Tasca 0", title:"Portada del dossier", desc:"Dissenya una portada que sigui teva.", prompts:["Nom i grup","Títol del dossier","Una composició visual relacionada amb tecnologia"], cover:true},
        {id:"b1t1", code:"1.1", title:"Definició de tecnologia", desc:"Què és la tecnologia i per què la fem servir?", prompts:["Explica amb les teves paraules què és la tecnologia.","Afegeix exemples de productes tecnològics de la vida quotidiana.","Relaciona cada exemple amb la necessitat que resol."]},
        {id:"b1t2", code:"1.2", title:"El procés tecnològic", desc:"Les fases ordenades per resoldre un problema o satisfer una necessitat.", prompts:["Descriu les 5 fases del procés tecnològic.","Afegeix un exemple senzill i aplica-hi les fases.","Pots fer un esquema amb fletxes."]},
        {id:"b1t3", code:"1.3", title:"Tecnologia i medi ambient", desc:"Impactes ambientals i les 3R: reduir, reutilitzar i reciclar.", prompts:["Tria exemples d'impacte ambiental causat per avenços tecnològics.","Explica'n les conseqüències.","Afegeix una proposta relacionada amb reduir, reutilitzar o reciclar."]},
        {id:"b1t4", code:"1.4", title:"Les eines i el taller", desc:"Famílies d'eines segons la feina que fan.", prompts:["Organitza les eines per famílies.","Afegeix imatges d'eines que coneguis.","Anota per a què serveix cadascuna."]},
        {id:"b1t5", code:"1.5", title:"Canvis d’unitats", desc:"Sistema Internacional, prefixes i factors de conversió.", prompts:["Resumeix les unitats bàsiques que utilitzem.","Fes una taula de prefixes.","Afegeix exemples de factors de conversió simples i compostos."]},
        {id:"b1t6", code:"1.6", title:"La memòria tècnica", desc:"Documentar què hem dissenyat, com ho hem fet i què hem après.", prompts:["Quines parts hauria de tenir una memòria tècnica?","Afegeix una evidència del projecte de taller quan en tinguis.","Anota millores que faries després d'avaluar el resultat."]}
      ]
    },
    {
      id:"b2", number:"02", title:"Digitalització i processador de textos", hours:"2 h",
      description:"Eines digitals per crear, organitzar i presentar informació.",
      topics:[
        {id:"b2t1",code:"2.1",title:"Processador de textos",desc:"Edició de documents i redacció de la memòria tècnica.",prompts:["Recull les eines d'edició que utilitzes.","Explica com estructures un document perquè sigui clar.","Afegeix una captura o exemple de formatació."]},
        {id:"b2t2",code:"2.2",title:"Classroom i Drive",desc:"Organització d'arxius i entorn virtual d'aprenentatge.",prompts:["Explica com organitzes carpetes i fitxers.","Anota bones pràctiques per posar noms als documents.","Afegeix una captura de la teva estructura si el professor ho demana."]}
      ]
    },
    {
      id:"b3", number:"03", title:"El dibuix tècnic", hours:"20 h",
      description:"Representar objectes amb vistes, perspectives, acotacions i escales.",
      topics:[
        {id:"b3t1",code:"3.1",title:"Vistes",desc:"Alçat, planta i perfil.",prompts:["Defineix alçat, planta i perfil.","Afegeix un exemple amb les tres vistes.","Anota quins errors has de vigilar."]},
        {id:"b3t2",code:"3.2",title:"Perspectives",desc:"Representació tridimensional d'objectes.",prompts:["Explica què aporta una perspectiva.","Afegeix exemples de peces.","Relaciona una perspectiva amb les seves vistes."]},
        {id:"b3t3",code:"3.3",title:"Acotacions i mesures",desc:"Indicar dimensions de manera tècnica i ordenada.",prompts:["Resumeix les normes bàsiques d'acotació.","Afegeix una peça acotada.","Anota errors habituals que vulguis evitar."]},
        {id:"b3t4",code:"3.4",title:"Escales",desc:"Relació entre les dimensions reals i la representació.",prompts:["Diferencia escala natural, reducció i ampliació.","Afegeix exemples 1:1, 1:10 i 10:1.","Resol un exemple i explica els passos."]}
      ]
    },
    {
      id:"b4", number:"04", title:"Materials", hours:"20 h",
      description:"Classificació, propietats i famílies de materials d'ús tecnològic.",
      topics:[
        {id:"b4t1",code:"4.1",title:"Classificació dels materials",desc:"D'on venen i com els agrupem.",prompts:["Crea un mapa de famílies de materials.","Afegeix exemples d'objectes reals.","Relaciona origen, propietats i usos."]},
        {id:"b4t2",code:"4.2",title:"Propietats dels materials",desc:"Propietats que determinen l'ús d'un material.",prompts:["Agrupa propietats mecàniques, físiques i tecnològiques.","Afegeix exemples.","Compara dos materials."]},
        {id:"b4t3",code:"4.3",title:"Fustes",desc:"Tipus, propietats i aplicacions.",prompts:["Diferencia fusta natural i derivats.","Afegeix exemples i usos.","Anota eines o tècniques relacionades."]},
        {id:"b4t4",code:"4.4",title:"Metalls",desc:"Metalls fèrrics, no fèrrics i aliatges.",prompts:["Organitza les famílies principals.","Afegeix usos quotidians.","Relaciona propietats amb aplicacions."]},
        {id:"b4t5",code:"4.5",title:"Plàstics",desc:"Tipus de plàstics, propietats, ús i reciclatge.",prompts:["Classifica els plàstics que estudiïs.","Afegeix símbols o objectes d'exemple.","Relaciona el tema amb sostenibilitat."]},
        {id:"b4t6",code:"4.6",title:"Materials tèxtils",desc:"Fibres naturals, artificials i sintètiques.",prompts:["Crea una classificació visual.","Afegeix peces o objectes d'exemple.","Compara propietats de dues fibres."]},
        {id:"b4t7",code:"4.7",title:"Ceràmics i petris",desc:"Materials minerals, ceràmics, vidres i petris.",prompts:["Classifica els materials estudiats.","Afegeix exemples d'edificació o objectes.","Relaciona propietats amb usos."]}
      ]
    },
    {
      id:"b5", number:"05", title:"Tecnologia i societat", hours:"4 h",
      description:"Com la tecnologia transforma la vida humana i el planeta.",
      topics:[
        {id:"b5t1",code:"5.1",title:"Tecnologia i ésser humà",desc:"Necessitats, solucions i transformacions socials.",prompts:["Tria una tecnologia i explica com ha canviat la vida quotidiana.","Afegeix avantatges i problemes.","Fes una conclusió personal."]},
        {id:"b5t2",code:"5.2",title:"Acceleració tecnològica",desc:"Canvis cada vegada més ràpids.",prompts:["Busca exemples de canvis tecnològics en poques dècades.","Fes una línia del temps.","Anota conseqüències d'aquesta acceleració."]},
        {id:"b5t3",code:"5.3",title:"Innovació tecnològica",desc:"Idees noves que milloren productes, processos o serveis.",prompts:["Explica què entens per innovació.","Afegeix un cas real.","Diferencia inventar i innovar."]},
        {id:"b5t4",code:"5.4",title:"Globalització",desc:"Tecnologies, producció i comunicació a escala mundial.",prompts:["Segueix el recorregut d'un producte global.","Afegeix un mapa, imatges o fletxes.","Anota efectes positius i negatius."]},
        {id:"b5t5",code:"5.5",title:"Sostenibilitat",desc:"Tecnologia, recursos i futur.",prompts:["Relaciona tecnologia i sostenibilitat.","Afegeix exemples de solucions sostenibles.","Proposa una millora possible al teu entorn."]}
      ]
    }
  ],
  activities: [
    {id:"a0",block:"b1",title:"Tasca 0 · Portada del dossier",type:"Dossier",desc:"Crea i personalitza la portada del teu dossier digital.",link:"",topic:"cover",analogLink:"https://docs.google.com/document/d/1u1isd-kkH3qT0L0_L5Eya4FA27xRQ7Kv/edit"},
    {id:"a1",block:"b1",title:"Tasca 1 · Procés tecnològic",type:"Liveworksheets",desc:"Activitat sobre les fases del procés tecnològic.",link:"https://www.liveworksheets.com/w/ca/tecnologia/399879",topic:"b1t2"},
    {id:"a2",block:"b1",title:"Tasca 2 · Tecnologia i medi ambient",type:"Dossier",desc:"Selecciona 5 exemples d'impacte ambiental i explica'n les conseqüències.",link:"",topic:"b1t3",analogLink:"https://docs.google.com/document/d/1u1isd-kkH3qT0L0_L5Eya4FA27xRQ7Kv/edit"},
    {id:"a3",block:"b1",title:"Tecno 12–18 · Procés tecnològic · Introducció",type:"Tecno 12–18",desc:"Activitat autocorrectiva externa.",link:"",topic:"b1t2"},
    {id:"a4",block:"b1",title:"Tecno 12–18 · Eines 1",type:"Tecno 12–18",desc:"Activitat autocorrectiva externa.",link:"",topic:"b1t4"},
    {id:"a5",block:"b1",title:"Tecno 12–18 · Eines 2",type:"Tecno 12–18",desc:"Activitat autocorrectiva externa.",link:"",topic:"b1t4"},
    {id:"a6",block:"b1",title:"Test global · Procés tecnològic",type:"Tecno 12–18",desc:"Test global autocorrectiu per fer a casa.",link:"",topic:"b1t4"},
    {id:"a7",block:"b2",title:"Tecno 12–18 · Processador de textos",type:"Tecno 12–18",desc:"Pràctica digital de processador de textos.",link:"",topic:"b2t1"},
    {id:"a8",block:"b2",title:"Mecanografia · 1–20",type:"Pràctica",desc:"Primera sèrie d'exercicis de mecanografia.",link:"",topic:"b2t1"},
    {id:"a9",block:"b2",title:"Mecanografia · 20–40",type:"Pràctica",desc:"Segona sèrie d'exercicis de mecanografia.",link:"",topic:"b2t1"},
    {id:"a10",block:"b5",title:"Tecno 12–18 · Tecnologia i societat 1–2",type:"Tecno 12–18",desc:"Activitats autocorrectives externes.",link:"",topic:"b5t1"},
    {id:"a11",block:"b5",title:"Tecno 12–18 · Tecnologia i societat 4–5",type:"Tecno 12–18",desc:"Activitats autocorrectives externes.",link:"",topic:"b5t4"},
    {id:"a12",block:"b1",title:"Qüestionari · Unitats 1–2–4–5",type:"Tecno 12–18",desc:"Qüestionari de pràctica sobre unitats.",link:"",topic:"b1t5"},
    {id:"a13",block:"b1",title:"Examen de prova",type:"Preparació",desc:"Simulacre abans de la prova escrita.",link:"",topic:"b1t5",analogLink:"https://docs.google.com/document/d/1u1isd-kkH3qT0L0_L5Eya4FA27xRQ7Kv/edit"},
    {id:"a14",block:"b1",title:"Prova escrita · 1r trimestre",type:"Prova",desc:"Consolidació de conceptes del primer trimestre.",link:"",topic:"b1t5"},
    {id:"a15",block:"b3",title:"Tecno 12–18 · Vistes de peces 1",type:"Tecno 12–18",desc:"Activitat externa de vistes.",link:"",topic:"b3t1",analogLink:"https://docs.google.com/document/d/1u1isd-kkH3qT0L0_L5Eya4FA27xRQ7Kv/edit"},
    {id:"a16",block:"b3",title:"Vistes de peces · 2–4",type:"Tecno 12–18",desc:"Sèrie d'activitats externes de vistes.",link:"",topic:"b3t1",analogLink:"https://docs.google.com/document/d/1u1isd-kkH3qT0L0_L5Eya4FA27xRQ7Kv/edit"},
    {id:"a17",block:"b3",title:"Perspectiva de peces · 1–4",type:"Tecno 12–18",desc:"Sèrie d'activitats externes de perspectiva.",link:"",topic:"b3t2",analogLink:"https://docs.google.com/document/d/1u1isd-kkH3qT0L0_L5Eya4FA27xRQ7Kv/edit"},
    {id:"a18",block:"b3",title:"Tecno 12–18 · Acotació",type:"Tecno 12–18",desc:"Activitat externa d'acotació.",link:"",topic:"b3t3",analogLink:"https://docs.google.com/document/d/1u1isd-kkH3qT0L0_L5Eya4FA27xRQ7Kv/edit"},
    {id:"a19",block:"b3",title:"Tecno 12–18 · Escales",type:"Tecno 12–18",desc:"Activitat externa d'escales.",link:"",topic:"b3t4",analogLink:"https://docs.google.com/document/d/1u1isd-kkH3qT0L0_L5Eya4FA27xRQ7Kv/edit"},
    {id:"a20",block:"b3",title:"Test global · Dibuix tècnic",type:"Tecno 12–18",desc:"Test autocorrectiu del bloc de dibuix tècnic.",link:"",topic:"b3t4"},
    {id:"a21",block:"b4",title:"Materials · Fustes",type:"Tecno 12–18",desc:"Activitats del bloc de fustes.",link:"",topic:"b4t3",analogLink:"https://docs.google.com/document/d/1u1isd-kkH3qT0L0_L5Eya4FA27xRQ7Kv/edit"},
    {id:"a22",block:"b4",title:"Materials · Paper",type:"Tecno 12–18",desc:"Activitats sobre paper i materials relacionats.",link:"",topic:"b4t7",analogLink:"https://docs.google.com/document/d/1u1isd-kkH3qT0L0_L5Eya4FA27xRQ7Kv/edit"},
    {id:"a23",block:"b4",title:"Materials · Plàstics",type:"Tecno 12–18",desc:"Activitats del bloc de plàstics.",link:"",topic:"b4t5",analogLink:"https://docs.google.com/document/d/1u1isd-kkH3qT0L0_L5Eya4FA27xRQ7Kv/edit"},
    {id:"a24",block:"b4",title:"Prova de materials",type:"Prova",desc:"Prova del bloc de materials segons la seqüenciació.",link:"",topic:"b4t5"},
    {id:"a25",block:"b5",title:"Prova final",type:"Prova",desc:"Prova final prevista a la seqüenciació del curs.",link:"",topic:"b5t5"}
  ]
};
