/** Big object to define the struli and the form pages **/

/* Define all sub-objects first*/

function define_rating_block(){
	
	var example = [{cat: "non-met", str: "l'épée de feu", id: "id_ex", check: 0}];
	
	var rating_form = [
		{
		id : "comp",
		quest : "Ressentez-vous que cette phrase était compréhensible ?",
		opt_str : ["1", "2", "3", "4", "5", "6", "7"],
		opt_val : ["1", "2", "3", "4", "5", "6", "7"],
		opt_extlabel: ["Incompréhension totale", "Compréhension totale"],
		},
		{
		id : "fam",
		quest : "Ressentez-vous que cette phrase était familière ?",
		opt_str : ["1", "2", "3", "4", "5", "6", "7"],
		opt_val : ["1", "2", "3", "4", "5", "6", "7"],
		opt_extlabel: ["Non familiarité totale", "Familiarité totale"],
		},
		{
		id : "beau",
		quest : "Ressentez-vous que cette phrase était belle ?",
		opt_str : ["1", "2", "3", "4", "5", "6", "7"],
		opt_val : ["1", "2", "3", "4", "5", "6", "7"],
		opt_extlabel: ["Complètement pas belle", "Complètement belle"],
		},
		{
		id : "meta",
		quest : "Pensez-vous que cette phrase est une métaphore ?",
		opt_str : ["1", "2", "3", "4", "5", "6", "7"],
		opt_val : ["1", "2", "3", "4", "5", "6", "7"],
		opt_extlabel: ["Complètement non métaphorique", "Complètement métaphorique"],
		}
	];
	var all_stim = {
		list_1: [{cat:"met", str:"l'arbre de jade", id:"id_1", check:0},
			{cat:"no-met", str:"le vieux chêne", id:"id_2", check:0},
			{cat:"met", str:"la vitre est un jardin", id:"id_3", check:0},
			{cat:"no-met", str:"le coup de croc", id:"id_4", check:0},
			{cat:"no-met", str:"le cher sauveur", id:"id_5", check:0},
			{cat:"no-met", str:"le large ruban", id:"id_6", check:0},
			{cat:"no-met", str:"les paroles sont une énigme", id:"id_7", check:0},
			{cat:"met", str:"la gloire souveraine", id:"id_8", check:0},
			{cat:"met", str:"les sombres essais", id:"id_9", check:0},
			{cat:"no-met", str:"l'île immense", id:"id_10", check:1},
			{cat:"met", str:"les vivants souvenirs", id:"id_11", check:0},
			{cat:"no-met", str:"les coups de queue", id:"id_12", check:0},
			{cat:"met", str:"la neige chaude", id:"id_13", check:0},
			{cat:"met", str:"l'écho suave", id:"id_14", check:0},
			{cat:"no-met", str:"l'homme est le chef", id:"id_15", check:0},
			{cat:"no-met", str:"l'âme est le principe", id:"id_16", check:0},
			{cat:"met", str:"la compassion est une aumône", id:"id_17", check:0},
			{cat:"no-met", str:"la haine est un tourment", id:"id_18", check:0},
			{cat:"met", str:"le débordement est un déluge", id:"id_19", check:0},
			{cat:"met", str:"les strophes amères", id:"id_20", check:0},
			{cat:"met", str:"le spectacle de l'univers", id:"id_21", check:0},
			{cat:"met", str:"la joie est une ivresse", id:"id_22", check:1},
			{cat:"no-met", str:"les larmes sont les pleurs", id:"id_23", check:0},
			{cat:"met", str:"l'ombre pasible", id:"id_24", check:0},
			{cat:"met", str:"la douce nuit", id:"id_25", check:0},
			{cat:"met", str:"la peinture mouvante", id:"id_26", check:0},
			{cat:"met", str:"les ruts de la folie", id:"id_27", check:1},
			{cat:"no-met", str:"le prêtre du temple", id:"id_28", check:0},
			{cat:"no-met", str:"l'habitude est l'obéissance", id:"id_29", check:0},
			{cat:"met", str:"le cœur est un violon", id:"id_30", check:0},
			{cat:"no-met", str:"le nom de femme", id:"id_31", check:0},
			{cat:"no-met", str:"la terrasse est un observatoire", id:"id_32", check:0},
			{cat:"met", str:"la régente de la floraison", id:"id_33", check:0},
			{cat:"met", str:"les folles traces", id:"id_34", check:0},
			{cat:"no-met", str:"les secrets de l'âme", id:"id_35", check:0},
			{cat:"no-met", str:"le jour de solitude", id:"id_36", check:0},
			{cat:"no-met", str:"le nom est un objet", id:"id_37", check:0},
			{cat:"met", str:"le sanglot de lumière", id:"id_38", check:0},
			{cat:"met", str:"le livre de mes jours", id:"id_39", check:0},
			{cat:"no-met", str:"le reste est procédure", id:"id_40", check:0}],
		list_2:[{cat:"met", str: "les heures sont des gemmes", id: "id_41", check: 0},
			{cat:"met", str: "le calme est le nid", id: "id_42", check: 1},
			{cat:"no-met", str: "l'immensité de la mer", id: "id_43", check: 0},
			{cat:"met", str: "la beauté céleste", id: "id_44", check: 0},
			{cat:"no-met", str: "le bonnet de nuit", id: "id_45", check: 0},
			{cat:"no-met", str: "l'énorme voûte", id: "id_46", check: 0},
			{cat:"met", str: "les fanfares de gloire", id: "id_47", check: 0},
			{cat:"met", str: "le trône est une alcôve", id: "id_48", check: 0},
			{cat:"no-met", str: "les trous nouveaux", id: "id_49", check: 1},
			{cat:"met", str: "la vie ingrate", id: "id_50", check: 0},
			{cat:"met", str: "le souffle est un souvenir", id: "id_51", check: 0},
			{cat:"met", str: "le sang est une gloire", id: "id_52", check: 0},
			{cat:"no-met", str: "l'oiseau noir", id: "id_53", check: 0},
			{cat:"met", str: "le voyage est un maître", id: "id_54", check: 0},
			{cat:"met", str: "le nez de beurre", id: "id_55", check: 0},
			{cat:"met", str: "la vie est un rêve", id: "id_56", check: 0},
			{cat:"no-met", str: "les heures noires", id: "id_57", check: 0},
			{cat:"met", str: "les convives de fer", id: "id_58", check: 0},
			{cat:"met", str: "la flamme des boucles", id: "id_59", check: 0},
			{cat:"no-met", str: "les beaux jours", id: "id_60", check: 0},
			{cat:"met", str: "les murs des ténèbres", id: "id_61", check: 0},
			{cat:"no-met", str: "l'homme malheureux", id: "id_62", check: 0},
			{cat:"no-met", str: "le droit est le droit", id: "id_63", check: 0},
			{cat:"no-met", str: "le prêtre est un vieillard", id: "id_64", check: 0},
			{cat:"no-met", str: "la ligne de bataille", id: "id_65", check: 0},
			{cat:"no-met", str: "la goutte de vin", id: "id_66", check: 0},
			{cat:"no-met", str: "les peuples de la Terre", id: "id_67", check: 1},
			{cat:"met", str: "la vie est une hymne", id: "id_68", check: 0},
			{cat:"no-met", str: "au détours de la route", id: "id_69", check: 0},
			{cat:"met", str: "l'apôtre de la paix", id: "id_70", check: 0},
			{cat:"met", str: "le ciel tragique", id: "id_71", check: 0},
			{cat:"met", str: "les noms sont l'adieu", id: "id_72", check: 0},
			{cat:"no-met", str: "l'épouvantable voix", id: "id_73", check: 0},
			{cat:"no-met", str: "la longue chevelure", id: "id_74", check: 0},
			{cat:"no-met", str: "le reste est folie", id: "id_75", check: 0},
			{cat:"no-met", str: "le langage affété", id: "id_76", check: 0},
			{cat:"no-met", str: "les noms de princes", id: "id_77", check: 0},
			{cat:"met", str: "les chants délicieux", id: "id_78", check: 0},
			{cat:"no-met", str: "la morte est la femme", id: "id_79", check: 0},
			{cat:"no-met", str: "les ennemis sont des gens", id: "id_80", check: 0}],		
		list_3: [{cat:"no-met", str: "la robe de soirée", id: "id_81", check: 0},
			{cat:"no-met", str: "l'enfant des entrailles", id: "id_82", check: 1},
			{cat:"no-met", str: "les termes de loyer", id: "id_83", check: 0},
			{cat:"met", str: "les bases sont les reins", id: "id_84", check: 0},
			{cat:"no-met", str: "le ciel noir", id: "id_85", check: 0},
			{cat:"no-met", str: "la forme de delta", id: "id_86", check: 0},
			{cat:"met", str: "la feuille est un baiser", id: "id_87", check: 0},
			{cat:"met", str: "la voix frèle", id: "id_88", check: 0},
			{cat:"no-met", str: "l'ancien désespoir", id: "id_89", check: 0},
			{cat:"met", str: "les forêts de crucifix", id: "id_90", check: 0},
			{cat:"met", str: "l'arbre est un flot", id: "id_91", check: 0},
			{cat:"met", str: "cette âme est une exilée", id: "id_92", check: 0},
			{cat:"no-met", str: "la vieille cymbale", id: "id_93", check: 0},
			{cat:"no-met", str: "les jours de la gloire", id: "id_94", check: 0},
			{cat:"met", str: "la déception amère", id: "id_95", check: 0},
			{cat:"met", str: "le repos ardent", id: "id_96", check: 0},
			{cat:"no-met", str: "l'ouvrage de la mère", id: "id_97", check: 0},
			{cat:"met", str: "la foule sanglante", id: "id_98", check: 0},
			{cat:"no-met", str: "les joyeux voisins", id: "id_99", check: 1},
			{cat:"met", str: "l'hymne de l'âme", id: "id_100", check: 0},
			{cat:"no-met", str: "les lieux sont la scène", id: "id_101", check: 0},
			{cat:"no-met", str: "l'homme est l'esclave", id: "id_102", check: 0},
			{cat:"met", str: "l'ombre est un payx", id: "id_103", check: 0},
			{cat:"no-met", str: "les rives glacées", id: "id_104", check: 0},
			{cat:"met", str: "la nuit est le séjour", id: "id_105", check: 1},
			{cat:"no-met", str: "les froides mains", id: "id_106", check: 0},
			{cat:"no-met", str: "le supplice est la vertue", id: "id_107", check: 0},
			{cat:"no-met", str: "la source est une mer", id: "id_108", check: 0},
			{cat:"no-met", str: "le siècle est un moment", id: "id_109", check: 0},
			{cat:"met", str: "le vin de la jeunesse", id: "id_110", check: 0},
			{cat:"met", str: "la perle de la nature", id: "id_111", check: 0},
			{cat:"met", str: "le bouquet de gloire", id: "id_112", check: 0},
			{cat:"no-met", str: "les sommets neigeux", id: "id_113", check: 0},
			{cat:"met", str: "l'ange de la nuit", id: "id_114", check: 0},
			{cat:"met", str: "la pauvre âme", id: "id_115", check: 0},
			{cat:"no-met", str: "le front d'enfant", id: "id_116", check: 0},
			{cat:"met", str: "l'amoureux silence", id: "id_117", check: 0},
			{cat:"no-met", str: "les hommes sont les fils", id: "id_118", check: 0},
			{cat:"met", str: "la pureté de la clarté", id: "id_119", check: 0},
			{cat:"met", str: "les blocs du silence", id: "id_120", check: 0}]
	};

	var check_obj = {
		list_1: {
			id_10: 	{opt_str: ["L'étendue, les dimensions sont considérables", 
			"La phrase décrit les caractéristiques d'un objet", "La phrase décrit les caractéristiques d'un lieu", "L'étendue, les dimensions sont minuscules"],
					opt_val: [1, 0, 1, 0]},
			id_22: {opt_str: ["La phrase décrit un sentiment de trouble", "La phrase s'applique à quelqu'un qui a bu trop d'alcool", "La phrase s'applique à un lieu", "La phrase décrit un sentiment de clarté"],
					opt_val: [1, 0, 0, 0]},
			id_27:  {opt_str: ["La phrase s'applique à quelque chose de raisonnée", "La phrase est en lien avec une agitation, une effervescence", "La phrase est en lien avec de la quiétude", "La phrase s'applique à quelque chose d'irraisonnée"],
					opt_val: [0, 1, 0, 1]}
		},
		list_2: {
			id_42: 	{opt_str: ["La phrase décrit une personne", "La phrase décrit quelque chose de bruyant", "La phrase concerne un lieu", "La phrase décrit quelque chose de paisible"],
					opt_val: [0, 0, 1, 1]},
			id_49: {opt_str: ["Concerne quelque chose de neuf", "Décrit un sentiment", "Décrit quelque chose de concret", "Concerne quelque chose de vieux"],
					opt_val: [1, 0, 1, 0]},
			id_67:  {opt_str: ["Concerne un objet", "Décrit un lieu", "Décrit un ensemble ", "Concerne une personne en particulier"],
					opt_val: [0, 0, 1, 0]}					
		},
		list_3: {
			id_82: 	{opt_str: ["Décrit une population", "Concerne un objet", "Parle de la Terre", "Parle de lien de parenté"],
					opt_val: [0, 0, 0, 1]},
			id_99: {opt_str: ["Se rapporte à un objet", "Concerne des personnes", "Est en lien avec la tristesse", "Concerne quelque chose de gai"],
					opt_val: [0, 1, 0, 1]},
			id_105:  {opt_str: ["Se rapporte à une personne", "Se rapporte à l'obscurité", "Se rapporte à la lumière", "Concerne un objet"],	
					opt_val: [0, 1, 0, 0]}			
		}
	};
	
	// random draw of the list
	var irand = Math.floor(Math.random() * 3) + 1;
	var list = 'list_' + irand;
	
	// prepare the random stim
	var stim_obj = all_stim[list];
	stim_obj = jsPsych.randomization.repeat(stim_obj, 1, 0);
	var check_obj = check_obj[list];

	// keep the check point stim
	var check_stim = stim_obj.filter(function(x){return x.check===1});
	stim_obj = stim_obj.filter(function(x){return x.check===0});
	// Randomize
	stim_obj = jsPsych.randomization.repeat(stim_obj, 1, 0);	
	check_stim = jsPsych.randomization.repeat(check_stim, 1, 0);

	// insert check 
	var ir = [Math.floor(Math.random()*4)+3, Math.floor(Math.random()*4)+17, Math.floor(Math.random()*4)+30];
	for (var i=0 ; i<ir.length ; i++){
		stim_obj.splice(ir[i], 0, check_stim[i]);
	}
	
	var rating_block = {type: 'form-rating',
					stim: stim_obj,
					rating: rating_form,
					check: check_obj,
					check_form: {
						quest: "Par rapport à la phrase que vous venez d'évaluer, cochez la ou les affirmations que vous pensez justes :",
						submit: "Valider",
						feedback: function(istrue){return (istrue)? "Résultat : C'est exact !" : "Résultat : Tout est une question de point de vue...";}
						}
					};
	var ex_block = {
		type: 'form-rating',
		stim: example,
		rating: rating_form,
		check: {},
		check_form:{}
	};
	//console.log(rating_block);
	return {full: rating_block, example: ex_block};
}

function define_art_block(){
	var allart_1 = [{name: "Laurent Abel", id: "id_1", val:0},
		{name: "Alexis Achard", id: "id_2", val:0},
		{name: "Jean Anouilh", id: "id_3", val:1},
		{name: "Aimé Auban", id: "id_4", val:0},
		{name: "Marcel Aymé", id: "id_5", val:1},
		{name: "Antoine Bandin", id: "id_6", val:0},
		{name: "Joseph Barthelme", id: "id_7", val:0},
		{name: "Eugène Barthendier", id: "id_8", val:0},
		{name: "Claire Binoche", id: "id_9", val:0},
		{name: "Yves Bonnefoy", id: "id_10", val:1},
		{name: "Pierre Boulle", id: "id_11", val:1},
		{name: "André  Breton", id: "id_12", val:1},
		{name: "Charlotte Calvez", id: "id_13", val:0},
		{name: "Blaise Cendrars", id: "id_14", val:1},
		{name: "Andrée Chedid", id: "id_15", val:1},
		{name: "André Chénier", id: "id_16", val:1},
		{name: "Gilberte Chevallet", id: "id_17", val:0},
		{name: "Charles Cros", id: "id_18", val:1},
		{name: "Frédéric Dard", id: "id_19", val:1},
		{name: "Alphonse Daudet", id: "id_20", val:1},
		{name: "Théodore de Banville", id: "id_21", val:1},
		{name: "Choderlos de Laclos", id: "id_22", val:1},
		{name: "René de Obaldia", id: "id_23", val:1},
		{name: "Auguste Derbay", id: "id_24", val:0},
		{name: "Francisque Desarmeaux", id: "id_25", val:0},
		{name: "Virginie Despentes", id: "id_26", val:1},
		{name: "Paul Eluard", id: "id_27", val:1},
		{name: "Jacques Emery", id: "id_28", val:0},
		{name: "Rodolphe Eynaud", id: "id_29", val:0},
		{name: "Séraphin Ezingeard", id: "id_30", val:0}];
	
	var allart_2 = [{name: "Auguste Gabert", id: "id_31", val:0},
		{name: "Marguerite Galet", id: "id_32", val:0},
		{name: "André Gide", id: "id_33", val:1},
		{name: "Jean Giono", id: "id_34", val:1},
		{name: "Catherine Girard", id: "id_35", val:0},
		{name: "Francis Jammes", id: "id_36", val:1},
		{name: "Alfred Jarry", id: "id_37", val:1},
		{name: "Gisèle Jospa", id: "id_38", val:0},
		{name: "Joseph Kessel", id: "id_39", val:1},
		{name: "Lucie Klein", id: "id_40", val:0},
		{name: "Alice Lindermann", id: "id_41", val:0},
		{name: "Pierre Louÿs", id: "id_42", val:1},
		{name: "Amin Maalouf", id: "id_43", val:1},
		{name: "Maurice Maeterlinck", id: "id_44", val:1},
		{name: "Robert Merle", id: "id_45", val:1},
		{name: "Henri Michaux", id: "id_46", val:1},
		{name: "Jean-François Pellegrin", id: "id_47", val:0},
		{name: "Georges  Perec", id: "id_48", val:1},
		{name: "Francis Ponge", id: "id_49", val:1},
		{name: "Claude Roy", id: "id_50", val:1},
		{name: "Suzanne Saunier", id: "id_51", val:0},
		{name: "Eugène Sue", id: "id_52", val:1},
		{name: "Jules Supervielle", id: "id_53", val:1},
		{name: "Samuel Taboul", id: "id_54", val:0},
		{name: "Elsa Triolet", id: "id_55", val:1},
		{name: "Boris Vian", id: "id_56", val:1},
		{name: "Fabrice Woerth", id: "id_57", val:0}];
	return [{type: 'form-author', stim: allart_1}, 
	{type: 'form-author', stim: allart_2}];

}		
/* ------------------------- General overview */
//var form_blocks = function(npbar_ini, npbar_tot){
function define_form_blocks(){			// npbar_ini, npbar_tot

	var demographic = [
			{
		type: "list",
		id: "age",
		quest: "Quel âge avez-vous ?",
		opt_str : ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "50", "51", "52", "53", "54", "55", "56", "57", "58", "59", "60", "61", "62", "63", "64", "65", "66", "67", "68", "69", "70", "71", "72", "73", "74", "75", "76", "77", "78", "79", "80", "81", "82", "83", "84", "85", "86", "87", "88", "89", "90", "91", "92", "93", "94", "95", "96", "97", "98", "99", "100", "101", "102", "103", "104", "105"],
		opt_id : ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "50", "51", "52", "53", "54", "55", "56", "57", "58", "59", "60", "61", "62", "63", "64", "65", "66", "67", "68", "69", "70", "71", "72", "73", "74", "75", "76", "77", "78", "79", "80", "81", "82", "83", "84", "85", "86", "87", "88", "89", "90", "91", "92", "93", "94", "95", "96", "97", "98", "99", "100", "101", "102", "103", "104", "105"],
		required: 1
		},
		{
		type: "radio",
		id: "gender",
		quest: "Quel est votre genre ?",
		opt_str : ["M", "F", "autre"],
		opt_id : ["m", "f", "o"],
		required: 1
		},

		{
		type : "list",
		id : "diplome",
		quest : "Quel est le plus haut diplôme que vous ayez obtenu ?",
		opt_str : ["BEP", "CAP", "BEPC", "Baccalauréat", "BP", "BM", "Licence", "Master","Doctorat", "Autre"],
		opt_id : ["bep", "cap", "bepc", "bac", "bp", "bm", "lic", "master", "doct", "other"],
		required: 1
		},
		{
		type : "text",
		id : "diplome_oth",
		quest : "Si autre, précisez :",
		input_nchar: 20,
		visible_if : ["diplome_other"]
		},
		{
		type : "list",
		id : "bac",
		quest : "Si c'est le cas, quel baccalauréat avez-vous obtenu ?",
		opt_str : ["Littéraire", "Scientifique", "Economique", "Technologique", "Autre"],
		opt_id : ["litt", "scien", "eco", "tech", "oth"],
		required: 0
		},
		{
		type : "text",
		id : "bac_other",
		quest : "Si autre, précisez :",
		input_nchar: 20,
		visible_if : ["bac_oth"]
		},
		{
		type : "text",
		id : "sector",
		quest : "Quelle est votre filière de formation ?",
		input_nchar: 20
		},		
		{
		type : "list",
		id : "csp",
		quest : "Quelle est votre catégorie socio-professionnelle ?",
		opt_str : ["Agriculteurs exploitants", "Artisans, commerçants et chefs d'entreprise", "Cadres et professions intellectuelles supérieures", "Professions intermédiaires", "Employés", "Ouvriers", "Etudiants", "Retraités", "Sans emplois", "Autre"],
		opt_id : ["agri", "arti", "commerc", "cadre", "interm", "employe", "etud", "retrait", "sans", "autre"],
		required: 1
		},
		{
		type : "radio",
		id : "lang_nat",
		quest : "Votre langue maternelle : ",
		opt_str : ["français", "autre"],
		opt_id : ["fr", "ot"],
		required: 1
		},
		
		{
		type : "text",
		id : "lang_natoth",
		quest : "Si autre, précisez :",
		input_nchar: 20,
		visible_if : ["lang_nat_ot"]
		}

	];		

	var reading = [
		{
		type : "list",
		id : "read_freq",
		quest : "Je lis pour le plaisir :",
		opt_str : ["Presque jamais"," Quelques fois par an", "Quelques fois par mois", "Au moins une fois par semaine", "Une ou plusieurs fois par jour"],
		opt_id : ["1", "2", "3", "4", "5"],
		required: 1
		},
		{
		type : "list",
		id : "read_book",
		quest : "A quelle fréquence lisez-vous des livres ?",
		opt_str : ["Jamais", "Entre 1 et 10 par an", "Entre 11 et 30 par an", "Entre 30 et 50 par an", "Plus de 50 par an"],
		opt_id : ["1", "2", "3", "4", "5"],
		required: 1
		},
		
		{
		type : "list",
		id : "read_poetry",
		quest : "A quelle fréquence lisez-vous de la poésie ?",
		opt_str : ["Jamais", "Entre 1 et 10 par an", "Entre 11 et 30 par an", "Entre 30 et 50 par an", "Plus de 50 par an"],
		opt_id : ["1", "2", "3", "4", "5"],
		required: 1
		},
		{
		type : "checkbox",
		id : "read_media_book",
		quest : "Sur quel(s) support(s) lisez-vous des livres ?",
		opt_str : ["Support papier", "Sur tablette/liseuse", "Audio", "Ecran d'ordinateur", "Je ne lis pas de livre"],
		opt_id : ["paper_a", "tablet_b", "audio_c", "pc_d", "no_e"],
		required: 1
		},
		{
		type : "checkbox",
		id : "read_media_poetry",
		quest : "Sur quel(s) support(s) lisez-vous des poésies ?",
		opt_str : ["Support papier", "Sur tablette/liseuse", "Audio", "Ecran d'ordinateur", "Je ne lis pas de poésie"],
		opt_id : ["paper_a", "tablet_b", "audio_c", "pc_d", "no_e"],
		required: 1
		},
		{
		type : "checkbox",
		id : "read_get",
		quest : "Quels sont vos habitudes pour vous procurer des livres (plusieurs réponses possibles) ?",
		opt_str : ["En librairie", "Via les sites marchants sur internet", "A la bibliothèque", "Par prêt", "Les boîtes à livres", "Les offres de livres gratuits disponibles", "Des versions pirates", "Cadeaux", "Je n'ai pas de livres"],
		opt_id : ["store_a", "web_b", "biblio_c", "pret_d", "box_e", "free_f", "pirate_g", "gift_h", "no_i"],
		required: 1
		}
	];
	var exp_problem = [
		{
		type: "radio",
		id: "exp_prob",
		quest: "Avez-vous rencontré un problème pendant cette expérience ?",
		opt_str : ["oui", "non"],
		opt_id : ["yes", "no"]
		},
		{
		type: "text",
		id: "exp_prob_which",
		quest: "Lequel ?",
		input_nchar: 50,
		visible_if : ["exp_prob_yes"]
		}
	];

	/* ================= Big form object */	
	//var iniarr = [];
	var hf_form = [
		{
			preamble: "Quelques questions pour finir :",
			elements: demographic	
		},	
		{
			preamble: 'Au sujet de vos habitudes de lecture : <p class="small">' +
					'Sélectionner la réponse qui vous correspond le mieux.</p>',
			elements: reading
		},
		{
			preamble: "Et enfin :",
			elements: exp_problem
		}
	];
		
	/*** Define ALL FORM BLOCKS*/

	var Npages = hf_form.length;
	var form_blocks = new Array(Npages);
	for (var i = 0; i < Npages ; i++) {
		
		form_blocks[i] = {
			type: "form",
			preamble: hf_form[i].preamble,
			progbar: false, //pbar,
			form_struct: hf_form[i].elements,
			submit: "Suivant"
		};
	}	
	form_blocks[Npages-1]["submit"] = "Validation finale !";
	return form_blocks;
};
