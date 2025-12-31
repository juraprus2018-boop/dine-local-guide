import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Declare EdgeRuntime for background tasks
declare const EdgeRuntime: {
  waitUntil: (promise: Promise<any>) => void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Complete list of Dutch municipalities and cities
const DUTCH_CITIES = [
  // Noord-Holland
  { name: "Amsterdam", lat: 52.3676, lng: 4.9041, province: "Noord-Holland" },
  { name: "Haarlem", lat: 52.3874, lng: 4.6462, province: "Noord-Holland" },
  { name: "Zaanstad", lat: 52.4559, lng: 4.8286, province: "Noord-Holland" },
  { name: "Alkmaar", lat: 52.6324, lng: 4.7534, province: "Noord-Holland" },
  { name: "Hilversum", lat: 52.2292, lng: 5.1669, province: "Noord-Holland" },
  { name: "Purmerend", lat: 52.5050, lng: 4.9597, province: "Noord-Holland" },
  { name: "Hoorn", lat: 52.6424, lng: 5.0594, province: "Noord-Holland" },
  { name: "Amstelveen", lat: 52.3114, lng: 4.8659, province: "Noord-Holland" },
  { name: "Heerhugowaard", lat: 52.6686, lng: 4.8306, province: "Noord-Holland" },
  { name: "Den Helder", lat: 52.9536, lng: 4.7606, province: "Noord-Holland" },
  { name: "Hoofddorp", lat: 52.3025, lng: 4.6889, province: "Noord-Holland" },
  { name: "Velsen", lat: 52.4606, lng: 4.6231, province: "Noord-Holland" },
  { name: "IJmuiden", lat: 52.4578, lng: 4.6228, province: "Noord-Holland" },
  { name: "Beverwijk", lat: 52.4819, lng: 4.6575, province: "Noord-Holland" },
  { name: "Heemskerk", lat: 52.5100, lng: 4.6700, province: "Noord-Holland" },
  { name: "Uithoorn", lat: 52.2378, lng: 4.8231, province: "Noord-Holland" },
  { name: "Castricum", lat: 52.5500, lng: 4.6667, province: "Noord-Holland" },
  { name: "Heiloo", lat: 52.6000, lng: 4.7000, province: "Noord-Holland" },
  { name: "Bergen", lat: 52.6667, lng: 4.7000, province: "Noord-Holland" },
  { name: "Schagen", lat: 52.7872, lng: 4.8017, province: "Noord-Holland" },
  { name: "Enkhuizen", lat: 52.7050, lng: 5.2919, province: "Noord-Holland" },
  { name: "Medemblik", lat: 52.7722, lng: 5.1075, province: "Noord-Holland" },
  { name: "Weesp", lat: 52.3075, lng: 5.0417, province: "Noord-Holland" },
  { name: "Diemen", lat: 52.3422, lng: 4.9600, province: "Noord-Holland" },
  { name: "Aalsmeer", lat: 52.2592, lng: 4.7603, province: "Noord-Holland" },
  { name: "Huizen", lat: 52.2975, lng: 5.2381, province: "Noord-Holland" },
  { name: "Bussum", lat: 52.2778, lng: 5.1653, province: "Noord-Holland" },
  { name: "Naarden", lat: 52.2958, lng: 5.1625, province: "Noord-Holland" },
  { name: "Laren", lat: 52.2556, lng: 5.2250, province: "Noord-Holland" },
  { name: "Blaricum", lat: 52.2750, lng: 5.2417, province: "Noord-Holland" },

  // Zuid-Holland
  { name: "Rotterdam", lat: 51.9244, lng: 4.4777, province: "Zuid-Holland" },
  { name: "Den Haag", lat: 52.0705, lng: 4.3007, province: "Zuid-Holland" },
  { name: "Leiden", lat: 52.1601, lng: 4.4970, province: "Zuid-Holland" },
  { name: "Dordrecht", lat: 51.8133, lng: 4.6901, province: "Zuid-Holland" },
  { name: "Zoetermeer", lat: 52.0575, lng: 4.4931, province: "Zuid-Holland" },
  { name: "Delft", lat: 52.0116, lng: 4.3571, province: "Zuid-Holland" },
  { name: "Gouda", lat: 52.0115, lng: 4.7104, province: "Zuid-Holland" },
  { name: "Schiedam", lat: 51.9225, lng: 4.3897, province: "Zuid-Holland" },
  { name: "Spijkenisse", lat: 51.8450, lng: 4.3292, province: "Zuid-Holland" },
  { name: "Vlaardingen", lat: 51.9125, lng: 4.3419, province: "Zuid-Holland" },
  { name: "Capelle aan den IJssel", lat: 51.9292, lng: 4.5783, province: "Zuid-Holland" },
  { name: "Katwijk", lat: 52.2000, lng: 4.4167, province: "Zuid-Holland" },
  { name: "Alphen aan den Rijn", lat: 52.1286, lng: 4.6550, province: "Zuid-Holland" },
  { name: "Ridderkerk", lat: 51.8708, lng: 4.6014, province: "Zuid-Holland" },
  { name: "Barendrecht", lat: 51.8556, lng: 4.5350, province: "Zuid-Holland" },
  { name: "Maassluis", lat: 51.9233, lng: 4.2500, province: "Zuid-Holland" },
  { name: "Rijswijk", lat: 52.0367, lng: 4.3267, province: "Zuid-Holland" },
  { name: "Leidschendam-Voorburg", lat: 52.0833, lng: 4.4000, province: "Zuid-Holland" },
  { name: "Voorburg", lat: 52.0708, lng: 4.3625, province: "Zuid-Holland" },
  { name: "Wassenaar", lat: 52.1458, lng: 4.4042, province: "Zuid-Holland" },
  { name: "Noordwijk", lat: 52.2358, lng: 4.4428, province: "Zuid-Holland" },
  { name: "Oegstgeest", lat: 52.1800, lng: 4.4700, province: "Zuid-Holland" },
  { name: "Lisse", lat: 52.2550, lng: 4.5567, province: "Zuid-Holland" },
  { name: "Hillegom", lat: 52.2917, lng: 4.5833, province: "Zuid-Holland" },
  { name: "Sassenheim", lat: 52.2250, lng: 4.5250, province: "Zuid-Holland" },
  { name: "Papendrecht", lat: 51.8317, lng: 4.6906, province: "Zuid-Holland" },
  { name: "Sliedrecht", lat: 51.8231, lng: 4.7719, province: "Zuid-Holland" },
  { name: "Zwijndrecht", lat: 51.8167, lng: 4.6333, province: "Zuid-Holland" },
  { name: "Hendrik-Ido-Ambacht", lat: 51.8417, lng: 4.6333, province: "Zuid-Holland" },
  { name: "Gorinchem", lat: 51.8350, lng: 4.9728, province: "Zuid-Holland" },
  { name: "Hellevoetsluis", lat: 51.8333, lng: 4.1333, province: "Zuid-Holland" },
  { name: "Waddinxveen", lat: 52.0417, lng: 4.6500, province: "Zuid-Holland" },
  { name: "Bodegraven", lat: 52.0833, lng: 4.7500, province: "Zuid-Holland" },
  { name: "Nieuwkoop", lat: 52.1500, lng: 4.7833, province: "Zuid-Holland" },

  // Utrecht
  { name: "Utrecht", lat: 52.0907, lng: 5.1214, province: "Utrecht" },
  { name: "Amersfoort", lat: 52.1561, lng: 5.3878, province: "Utrecht" },
  { name: "Veenendaal", lat: 52.0275, lng: 5.5583, province: "Utrecht" },
  { name: "Nieuwegein", lat: 52.0333, lng: 5.0833, province: "Utrecht" },
  { name: "Zeist", lat: 52.0833, lng: 5.2333, province: "Utrecht" },
  { name: "Houten", lat: 52.0289, lng: 5.1683, province: "Utrecht" },
  { name: "IJsselstein", lat: 52.0167, lng: 5.0500, province: "Utrecht" },
  { name: "Woerden", lat: 52.0856, lng: 4.8831, province: "Utrecht" },
  { name: "Soest", lat: 52.1750, lng: 5.2917, province: "Utrecht" },
  { name: "Bunschoten", lat: 52.2417, lng: 5.3833, province: "Utrecht" },
  { name: "Baarn", lat: 52.2117, lng: 5.2875, province: "Utrecht" },
  { name: "Bilthoven", lat: 52.1333, lng: 5.2000, province: "Utrecht" },
  { name: "De Bilt", lat: 52.1083, lng: 5.1750, province: "Utrecht" },
  { name: "Maarssen", lat: 52.1333, lng: 5.0333, province: "Utrecht" },
  { name: "Breukelen", lat: 52.1750, lng: 5.0000, province: "Utrecht" },
  { name: "Driebergen", lat: 52.0500, lng: 5.2833, province: "Utrecht" },
  { name: "Doorn", lat: 52.0333, lng: 5.3500, province: "Utrecht" },
  { name: "Wijk bij Duurstede", lat: 51.9750, lng: 5.3417, province: "Utrecht" },
  { name: "Rhenen", lat: 51.9594, lng: 5.5711, province: "Utrecht" },
  { name: "Leusden", lat: 52.1333, lng: 5.4333, province: "Utrecht" },

  // Noord-Brabant
  { name: "Eindhoven", lat: 51.4416, lng: 5.4697, province: "Noord-Brabant" },
  { name: "Tilburg", lat: 51.5555, lng: 5.0913, province: "Noord-Brabant" },
  { name: "Breda", lat: 51.5719, lng: 4.7683, province: "Noord-Brabant" },
  { name: "Den Bosch", lat: 51.6998, lng: 5.3049, province: "Noord-Brabant" },
  { name: "Oss", lat: 51.7650, lng: 5.5180, province: "Noord-Brabant" },
  { name: "Roosendaal", lat: 51.5308, lng: 4.4653, province: "Noord-Brabant" },
  { name: "Helmond", lat: 51.4758, lng: 5.6611, province: "Noord-Brabant" },
  { name: "Bergen op Zoom", lat: 51.4949, lng: 4.2911, province: "Noord-Brabant" },
  { name: "Waalwijk", lat: 51.6833, lng: 5.0667, province: "Noord-Brabant" },
  { name: "Veghel", lat: 51.6167, lng: 5.5500, province: "Noord-Brabant" },
  { name: "Veldhoven", lat: 51.4208, lng: 5.4050, province: "Noord-Brabant" },
  { name: "Uden", lat: 51.6619, lng: 5.6178, province: "Noord-Brabant" },
  { name: "Best", lat: 51.5083, lng: 5.3917, province: "Noord-Brabant" },
  { name: "Boxtel", lat: 51.5917, lng: 5.3333, province: "Noord-Brabant" },
  { name: "Dongen", lat: 51.6250, lng: 4.9417, province: "Noord-Brabant" },
  { name: "Etten-Leur", lat: 51.5750, lng: 4.6333, province: "Noord-Brabant" },
  { name: "Geldrop", lat: 51.4217, lng: 5.5583, province: "Noord-Brabant" },
  { name: "Valkenswaard", lat: 51.3500, lng: 5.4667, province: "Noord-Brabant" },
  { name: "Woensdrecht", lat: 51.4333, lng: 4.3000, province: "Noord-Brabant" },
  { name: "Zundert", lat: 51.4667, lng: 4.6500, province: "Noord-Brabant" },
  { name: "Oosterhout", lat: 51.6417, lng: 4.8583, province: "Noord-Brabant" },
  { name: "Cuijk", lat: 51.7333, lng: 5.8833, province: "Noord-Brabant" },
  { name: "Boxmeer", lat: 51.6500, lng: 5.9500, province: "Noord-Brabant" },
  { name: "Gemert", lat: 51.5583, lng: 5.6917, province: "Noord-Brabant" },
  { name: "Deurne", lat: 51.4667, lng: 5.8000, province: "Noord-Brabant" },
  { name: "Asten", lat: 51.4000, lng: 5.7500, province: "Noord-Brabant" },
  { name: "Someren", lat: 51.3833, lng: 5.7167, province: "Noord-Brabant" },
  { name: "Nuenen", lat: 51.4667, lng: 5.5500, province: "Noord-Brabant" },
  { name: "Son en Breugel", lat: 51.5167, lng: 5.5000, province: "Noord-Brabant" },

  // Gelderland
  { name: "Nijmegen", lat: 51.8126, lng: 5.8372, province: "Gelderland" },
  { name: "Apeldoorn", lat: 52.2112, lng: 5.9699, province: "Gelderland" },
  { name: "Arnhem", lat: 51.9851, lng: 5.8987, province: "Gelderland" },
  { name: "Ede", lat: 52.0404, lng: 5.6648, province: "Gelderland" },
  { name: "Harderwijk", lat: 52.3500, lng: 5.6167, province: "Gelderland" },
  { name: "Doetinchem", lat: 51.9653, lng: 6.2889, province: "Gelderland" },
  { name: "Wageningen", lat: 51.9692, lng: 5.6653, province: "Gelderland" },
  { name: "Zutphen", lat: 52.1383, lng: 6.2017, province: "Gelderland" },
  { name: "Tiel", lat: 51.8833, lng: 5.4333, province: "Gelderland" },
  { name: "Barneveld", lat: 52.1400, lng: 5.5847, province: "Gelderland" },
  { name: "Elburg", lat: 52.4500, lng: 5.8333, province: "Gelderland" },
  { name: "Ermelo", lat: 52.3000, lng: 5.6167, province: "Gelderland" },
  { name: "Nunspeet", lat: 52.3792, lng: 5.7819, province: "Gelderland" },
  { name: "Putten", lat: 52.2583, lng: 5.6083, province: "Gelderland" },
  { name: "Epe", lat: 52.3500, lng: 5.9833, province: "Gelderland" },
  { name: "Hattem", lat: 52.4750, lng: 6.0667, province: "Gelderland" },
  { name: "Lochem", lat: 52.1600, lng: 6.4139, province: "Gelderland" },
  { name: "Winterswijk", lat: 51.9708, lng: 6.7214, province: "Gelderland" },
  { name: "Aalten", lat: 51.9250, lng: 6.5833, province: "Gelderland" },
  { name: "Zevenaar", lat: 51.9333, lng: 6.0833, province: "Gelderland" },
  { name: "Duiven", lat: 51.9500, lng: 6.0167, province: "Gelderland" },
  { name: "Westervoort", lat: 51.9583, lng: 5.9750, province: "Gelderland" },
  { name: "Rheden", lat: 52.0167, lng: 6.0333, province: "Gelderland" },
  { name: "Rozendaal", lat: 52.0000, lng: 5.9667, province: "Gelderland" },
  { name: "Culemborg", lat: 51.9500, lng: 5.2333, province: "Gelderland" },
  { name: "Geldermalsen", lat: 51.8833, lng: 5.2833, province: "Gelderland" },
  { name: "Maasdriel", lat: 51.8000, lng: 5.2667, province: "Gelderland" },
  { name: "Wijchen", lat: 51.8083, lng: 5.7250, province: "Gelderland" },
  { name: "Beuningen", lat: 51.8583, lng: 5.7667, province: "Gelderland" },
  { name: "Druten", lat: 51.8833, lng: 5.6000, province: "Gelderland" },

  // Overijssel
  { name: "Enschede", lat: 52.2215, lng: 6.8937, province: "Overijssel" },
  { name: "Zwolle", lat: 52.5168, lng: 6.0830, province: "Overijssel" },
  { name: "Deventer", lat: 52.2549, lng: 6.1600, province: "Overijssel" },
  { name: "Almelo", lat: 52.3567, lng: 6.6625, province: "Overijssel" },
  { name: "Hengelo", lat: 52.2658, lng: 6.7931, province: "Overijssel" },
  { name: "Kampen", lat: 52.5553, lng: 5.9114, province: "Overijssel" },
  { name: "Oldenzaal", lat: 52.3133, lng: 6.9292, province: "Overijssel" },
  { name: "Hardenberg", lat: 52.5750, lng: 6.6167, province: "Overijssel" },
  { name: "Raalte", lat: 52.3833, lng: 6.2750, province: "Overijssel" },
  { name: "Rijssen", lat: 52.3083, lng: 6.5167, province: "Overijssel" },
  { name: "Holten", lat: 52.2833, lng: 6.4167, province: "Overijssel" },
  { name: "Ommen", lat: 52.5167, lng: 6.4167, province: "Overijssel" },
  { name: "Dalfsen", lat: 52.5167, lng: 6.2500, province: "Overijssel" },
  { name: "Staphorst", lat: 52.6333, lng: 6.2000, province: "Overijssel" },
  { name: "Steenwijkerland", lat: 52.7833, lng: 6.1167, province: "Overijssel" },
  { name: "Steenwijk", lat: 52.7861, lng: 6.1167, province: "Overijssel" },
  { name: "Zwartsluis", lat: 52.6333, lng: 6.0667, province: "Overijssel" },
  { name: "Genemuiden", lat: 52.6167, lng: 6.0333, province: "Overijssel" },
  { name: "Hasselt", lat: 52.5917, lng: 6.0917, province: "Overijssel" },
  { name: "Wierden", lat: 52.3583, lng: 6.5917, province: "Overijssel" },
  { name: "Hellendoorn", lat: 52.3917, lng: 6.4500, province: "Overijssel" },
  { name: "Nijverdal", lat: 52.3667, lng: 6.4667, province: "Overijssel" },
  { name: "Vriezenveen", lat: 52.4083, lng: 6.6250, province: "Overijssel" },
  { name: "Tubbergen", lat: 52.4083, lng: 6.7833, province: "Overijssel" },
  { name: "Denekamp", lat: 52.3750, lng: 7.0000, province: "Overijssel" },
  { name: "Losser", lat: 52.2667, lng: 7.0000, province: "Overijssel" },
  { name: "Haaksbergen", lat: 52.1583, lng: 6.7417, province: "Overijssel" },
  { name: "Borne", lat: 52.3000, lng: 6.7500, province: "Overijssel" },
  { name: "Delden", lat: 52.2583, lng: 6.7167, province: "Overijssel" },
  { name: "Goor", lat: 52.2333, lng: 6.5833, province: "Overijssel" },

  // Limburg
  { name: "Maastricht", lat: 50.8514, lng: 5.6910, province: "Limburg" },
  { name: "Venlo", lat: 51.3704, lng: 6.1724, province: "Limburg" },
  { name: "Heerlen", lat: 50.8882, lng: 5.9795, province: "Limburg" },
  { name: "Sittard", lat: 51.0000, lng: 5.8667, province: "Limburg" },
  { name: "Geleen", lat: 50.9750, lng: 5.8333, province: "Limburg" },
  { name: "Roermond", lat: 51.1944, lng: 5.9875, province: "Limburg" },
  { name: "Weert", lat: 51.2517, lng: 5.7072, province: "Limburg" },
  { name: "Kerkrade", lat: 50.8658, lng: 6.0625, province: "Limburg" },
  { name: "Landgraaf", lat: 50.8917, lng: 6.0167, province: "Limburg" },
  { name: "Brunssum", lat: 50.9417, lng: 5.9667, province: "Limburg" },
  { name: "Stein", lat: 50.9667, lng: 5.7667, province: "Limburg" },
  { name: "Valkenburg", lat: 50.8667, lng: 5.8333, province: "Limburg" },
  { name: "Gulpen", lat: 50.8167, lng: 5.8833, province: "Limburg" },
  { name: "Meerssen", lat: 50.8833, lng: 5.7500, province: "Limburg" },
  { name: "Eijsden", lat: 50.7833, lng: 5.7167, province: "Limburg" },
  { name: "Vaals", lat: 50.7667, lng: 6.0167, province: "Limburg" },
  { name: "Simpelveld", lat: 50.8333, lng: 5.9833, province: "Limburg" },
  { name: "Beek", lat: 50.9417, lng: 5.7917, province: "Limburg" },
  { name: "Nuth", lat: 50.9167, lng: 5.8833, province: "Limburg" },
  { name: "Voerendaal", lat: 50.8750, lng: 5.9333, province: "Limburg" },
  { name: "Panningen", lat: 51.3250, lng: 5.9750, province: "Limburg" },
  { name: "Tegelen", lat: 51.3417, lng: 6.1500, province: "Limburg" },
  { name: "Venray", lat: 51.5250, lng: 5.9750, province: "Limburg" },
  { name: "Horst", lat: 51.4583, lng: 6.0583, province: "Limburg" },
  { name: "Nederweert", lat: 51.2833, lng: 5.7500, province: "Limburg" },
  { name: "Maasbracht", lat: 51.1333, lng: 5.8833, province: "Limburg" },
  { name: "Echt", lat: 51.1000, lng: 5.8667, province: "Limburg" },
  { name: "Susteren", lat: 51.0667, lng: 5.8500, province: "Limburg" },
  { name: "Born", lat: 51.0333, lng: 5.8000, province: "Limburg" },
  { name: "Gennep", lat: 51.6989, lng: 5.9722, province: "Limburg" },

  // Groningen
  { name: "Groningen", lat: 53.2194, lng: 6.5665, province: "Groningen" },
  { name: "Hoogezand", lat: 53.1617, lng: 6.7611, province: "Groningen" },
  { name: "Stadskanaal", lat: 52.9917, lng: 6.9500, province: "Groningen" },
  { name: "Veendam", lat: 53.1000, lng: 6.8833, province: "Groningen" },
  { name: "Winschoten", lat: 53.1417, lng: 7.0333, province: "Groningen" },
  { name: "Delfzijl", lat: 53.3333, lng: 6.9167, province: "Groningen" },
  { name: "Appingedam", lat: 53.3208, lng: 6.8583, province: "Groningen" },
  { name: "Leek", lat: 53.1583, lng: 6.3750, province: "Groningen" },
  { name: "Haren", lat: 53.1750, lng: 6.6083, province: "Groningen" },
  { name: "Zuidhorn", lat: 53.2500, lng: 6.4000, province: "Groningen" },
  { name: "Bedum", lat: 53.3000, lng: 6.6000, province: "Groningen" },
  { name: "Ten Boer", lat: 53.2833, lng: 6.6833, province: "Groningen" },
  { name: "Uithuizen", lat: 53.4083, lng: 6.6750, province: "Groningen" },
  { name: "Loppersum", lat: 53.3333, lng: 6.7500, province: "Groningen" },
  { name: "Slochteren", lat: 53.2167, lng: 6.8000, province: "Groningen" },
  { name: "Muntendam", lat: 53.1083, lng: 6.8333, province: "Groningen" },
  { name: "Scheemda", lat: 53.1583, lng: 6.9833, province: "Groningen" },
  { name: "Oude Pekela", lat: 53.1000, lng: 7.0000, province: "Groningen" },
  { name: "Nieuwe Pekela", lat: 53.0667, lng: 7.0167, province: "Groningen" },
  { name: "Ter Apel", lat: 52.8750, lng: 7.0667, province: "Groningen" },

  // Friesland
  { name: "Leeuwarden", lat: 53.2012, lng: 5.7999, province: "Friesland" },
  { name: "Drachten", lat: 53.1083, lng: 6.1000, province: "Friesland" },
  { name: "Heerenveen", lat: 52.9608, lng: 5.9239, province: "Friesland" },
  { name: "Sneek", lat: 53.0333, lng: 5.6667, province: "Friesland" },
  { name: "Harlingen", lat: 53.1750, lng: 5.4167, province: "Friesland" },
  { name: "Franeker", lat: 53.1833, lng: 5.5333, province: "Friesland" },
  { name: "Dokkum", lat: 53.3250, lng: 5.9983, province: "Friesland" },
  { name: "Bolsward", lat: 53.0667, lng: 5.5333, province: "Friesland" },
  { name: "Wolvega", lat: 52.8750, lng: 5.9917, province: "Friesland" },
  { name: "Joure", lat: 52.9667, lng: 5.8000, province: "Friesland" },
  { name: "Lemmer", lat: 52.8417, lng: 5.7083, province: "Friesland" },
  { name: "Gorredijk", lat: 53.0083, lng: 6.0667, province: "Friesland" },
  { name: "Burgum", lat: 53.1917, lng: 5.9917, province: "Friesland" },
  { name: "Kollum", lat: 53.2833, lng: 6.1500, province: "Friesland" },
  { name: "Balk", lat: 52.9000, lng: 5.5833, province: "Friesland" },
  { name: "Makkum", lat: 53.0500, lng: 5.4000, province: "Friesland" },
  { name: "Workum", lat: 52.9833, lng: 5.4500, province: "Friesland" },
  { name: "Hindeloopen", lat: 52.9417, lng: 5.4000, province: "Friesland" },
  { name: "Stavoren", lat: 52.8833, lng: 5.3667, province: "Friesland" },
  { name: "Sint Annaparochie", lat: 53.2667, lng: 5.6500, province: "Friesland" },

  // Drenthe
  { name: "Assen", lat: 52.9925, lng: 6.5625, province: "Drenthe" },
  { name: "Emmen", lat: 52.7792, lng: 6.8958, province: "Drenthe" },
  { name: "Hoogeveen", lat: 52.7167, lng: 6.4833, province: "Drenthe" },
  { name: "Meppel", lat: 52.6958, lng: 6.1944, province: "Drenthe" },
  { name: "Coevorden", lat: 52.6583, lng: 6.7417, province: "Drenthe" },
  { name: "Beilen", lat: 52.8583, lng: 6.5167, province: "Drenthe" },
  { name: "Roden", lat: 53.1417, lng: 6.4333, province: "Drenthe" },
  { name: "Gieten", lat: 53.0000, lng: 6.7667, province: "Drenthe" },
  { name: "Borger", lat: 52.9250, lng: 6.7917, province: "Drenthe" },
  { name: "Zuidlaren", lat: 53.1000, lng: 6.6833, province: "Drenthe" },
  { name: "Eelde", lat: 53.1333, lng: 6.5667, province: "Drenthe" },
  { name: "Vries", lat: 53.0833, lng: 6.5500, province: "Drenthe" },
  { name: "Norg", lat: 53.0583, lng: 6.4667, province: "Drenthe" },
  { name: "Westerbork", lat: 52.8500, lng: 6.6000, province: "Drenthe" },
  { name: "Dwingeloo", lat: 52.8333, lng: 6.3667, province: "Drenthe" },
  { name: "Diever", lat: 52.8500, lng: 6.3167, province: "Drenthe" },
  { name: "Havelte", lat: 52.7667, lng: 6.2333, province: "Drenthe" },
  { name: "Ruinen", lat: 52.7667, lng: 6.3667, province: "Drenthe" },
  { name: "De Wijk", lat: 52.7000, lng: 6.2833, province: "Drenthe" },
  { name: "Klazienaveen", lat: 52.7250, lng: 6.9833, province: "Drenthe" },

  // Flevoland
  { name: "Almere", lat: 52.3508, lng: 5.2647, province: "Flevoland" },
  { name: "Lelystad", lat: 52.5185, lng: 5.4714, province: "Flevoland" },
  { name: "Dronten", lat: 52.5333, lng: 5.7167, province: "Flevoland" },
  { name: "Emmeloord", lat: 52.7100, lng: 5.7500, province: "Flevoland" },
  { name: "Urk", lat: 52.6617, lng: 5.5997, province: "Flevoland" },
  { name: "Zeewolde", lat: 52.3333, lng: 5.5333, province: "Flevoland" },
  { name: "Biddinghuizen", lat: 52.4500, lng: 5.7000, province: "Flevoland" },
  { name: "Swifterbant", lat: 52.5667, lng: 5.6333, province: "Flevoland" },
  { name: "Marknesse", lat: 52.7167, lng: 5.8500, province: "Flevoland" },
  { name: "Nagele", lat: 52.6500, lng: 5.7167, province: "Flevoland" },

  // Zeeland
  { name: "Middelburg", lat: 51.5000, lng: 3.6167, province: "Zeeland" },
  { name: "Vlissingen", lat: 51.4417, lng: 3.5708, province: "Zeeland" },
  { name: "Goes", lat: 51.5033, lng: 3.8917, province: "Zeeland" },
  { name: "Terneuzen", lat: 51.3333, lng: 3.8333, province: "Zeeland" },
  { name: "Zierikzee", lat: 51.6500, lng: 3.9167, province: "Zeeland" },
  { name: "Hulst", lat: 51.2833, lng: 4.0500, province: "Zeeland" },
  { name: "Sluis", lat: 51.3083, lng: 3.3833, province: "Zeeland" },
  { name: "Veere", lat: 51.5500, lng: 3.6667, province: "Zeeland" },
  { name: "Domburg", lat: 51.5667, lng: 3.5000, province: "Zeeland" },
  { name: "Westkapelle", lat: 51.5333, lng: 3.4333, province: "Zeeland" },
  { name: "Koudekerke", lat: 51.4833, lng: 3.5500, province: "Zeeland" },
  { name: "Oost-Souburg", lat: 51.4667, lng: 3.5833, province: "Zeeland" },
  { name: "Kapelle", lat: 51.4833, lng: 3.9500, province: "Zeeland" },
  { name: "Yerseke", lat: 51.4917, lng: 4.0500, province: "Zeeland" },
  { name: "Tholen", lat: 51.5333, lng: 4.2167, province: "Zeeland" },
  { name: "Brouwershaven", lat: 51.7250, lng: 3.9167, province: "Zeeland" },
  { name: "Renesse", lat: 51.7333, lng: 3.7833, province: "Zeeland" },
  { name: "Cadzand", lat: 51.3750, lng: 3.4083, province: "Zeeland" },
  { name: "Oostburg", lat: 51.3250, lng: 3.4917, province: "Zeeland" },
  { name: "Axel", lat: 51.2667, lng: 3.9167, province: "Zeeland" },
];

// Cuisine type mapping from Google to our slugs
const CUISINE_MAPPING: Record<string, string> = {
  'italian_restaurant': 'italiaans',
  'chinese_restaurant': 'chinees',
  'japanese_restaurant': 'japans',
  'thai_restaurant': 'thais',
  'indian_restaurant': 'indiaas',
  'mexican_restaurant': 'mexicaans',
  'french_restaurant': 'frans',
  'greek_restaurant': 'grieks',
  'spanish_restaurant': 'spaans',
  'turkish_restaurant': 'turks',
  'american_restaurant': 'amerikaans',
  'mediterranean_restaurant': 'mediterraans',
  'indonesian_restaurant': 'indonesisch',
  'steak_house': 'steakhouse',
  'seafood_restaurant': 'visrestaurant',
  'vegetarian_restaurant': 'vegetarisch',
  'vegan_restaurant': 'vegan',
  'sushi_restaurant': 'japans',
  'pizza_restaurant': 'italiaans',
};

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function downloadAndUploadImage(
  supabase: any,
  imageUrl: string,
  citySlug: string,
  restaurantSlug: string
): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;

    const blob = await response.blob();
    const fileName = `${citySlug}/${restaurantSlug}/${restaurantSlug}-${citySlug}-happio.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('restaurant-photos')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('restaurant-photos')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Image download/upload error:', error);
    return null;
  }
}

// Background import process that runs independently
async function runBackgroundImport(supabase: any, jobId: string, GOOGLE_API_KEY: string) {
  console.log(`Starting background import for job ${jobId}`);
  
  try {
    // Update job status to running
    await supabase
      .from('import_jobs')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
        total_cities: DUTCH_CITIES.length,
      })
      .eq('id', jobId);

    let processedCities = 0;
    let totalImportedRestaurants = 0;
    let totalImportedReviews = 0;
    let totalSkipped = 0;
    const allErrors: string[] = [];

    for (const cityData of DUTCH_CITIES) {
      console.log(`Processing city: ${cityData.name} (${processedCities + 1}/${DUTCH_CITIES.length})`);
      
      try {
        // Create or get city
        const citySlug = createSlug(cityData.name);
        let cityId: string;

        const { data: existingCity } = await supabase
          .from('cities')
          .select('id')
          .eq('slug', citySlug)
          .maybeSingle();

        if (existingCity) {
          cityId = existingCity.id;
        } else {
          const { data: newCity, error: cityError } = await supabase
            .from('cities')
            .insert({
              name: cityData.name,
              slug: citySlug,
              province: cityData.province,
              latitude: cityData.lat,
              longitude: cityData.lng,
              description: `Ontdek de beste restaurants in ${cityData.name}, ${cityData.province}. Van gezellige eetcafés tot fine dining.`,
              meta_title: `Beste Restaurants ${cityData.name} | Reviews & Menu's | Happio`,
              meta_description: `Vind de ${cityData.name} beste restaurants. Lees reviews, bekijk menu's en reserveer direct. ✓ Actuele openingstijden ✓ Foto's ✓ Beoordelingen`,
            })
            .select('id')
            .single();

          if (cityError) {
            console.error(`Error creating city ${cityData.name}:`, cityError);
            allErrors.push(`City ${cityData.name}: ${cityError.message}`);
            processedCities++;
            continue;
          }
          cityId = newCity.id;
        }

        // Fetch all restaurants with pagination (up to 60 results)
        const excludedTypes = ['lodging', 'hotel', 'bed_and_breakfast', 'guest_house', 'campground', 'rv_park', 'motel'];
        const allRestaurants: any[] = [];
        let nextPageToken: string | null = null;
        let pageCount = 0;
        const maxPages = 3; // Google returns max 20 per page, 3 pages = 60 results

        do {
          const searchUrl: string = nextPageToken 
            ? `https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=${nextPageToken}&key=${GOOGLE_API_KEY}`
            : `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${cityData.lat},${cityData.lng}&radius=5000&type=restaurant&key=${GOOGLE_API_KEY}`;
          
          const searchResponse: Response = await fetch(searchUrl);
          const searchData: any = await searchResponse.json();

          if (searchData.status === 'OK' && searchData.results) {
            // Filter out hotels/B&Bs and low-rated places
            const filteredResults = searchData.results.filter((r: any) => {
              if (r.rating && r.rating < 3.0) return false;
              if (r.types && r.types.some((t: string) => excludedTypes.includes(t))) {
                return false;
              }
              return true;
            });
            allRestaurants.push(...filteredResults);
          }

          nextPageToken = searchData.next_page_token || null;
          pageCount++;

          // Google requires a short delay before using next_page_token
          if (nextPageToken && pageCount < maxPages) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } while (nextPageToken && pageCount < maxPages);

        if (allRestaurants.length === 0) {
          console.log(`No restaurants found for ${cityData.name}`);
          processedCities++;
          continue;
        }

        console.log(`Found ${allRestaurants.length} restaurants in ${cityData.name}`);
        const topRestaurants = allRestaurants;

        for (const place of topRestaurants) {
          // Check if already exists
          const { data: existing } = await supabase
            .from('restaurants')
            .select('id')
            .eq('google_place_id', place.place_id)
            .maybeSingle();

          if (existing) {
            totalSkipped++;
            continue;
          }

          // Get place details with reviews in Dutch
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,opening_hours,price_level,rating,user_ratings_total,photos,types,geometry,reviews&language=nl&reviews_sort=newest&key=${GOOGLE_API_KEY}`;
          
          const detailsResponse = await fetch(detailsUrl);
          const detailsData = await detailsResponse.json();

          if (detailsData.status !== 'OK') {
            console.log(`Could not get details for ${place.name}`);
            continue;
          }

          const details = detailsData.result;
          const restaurantSlug = createSlug(details.name);

          // Download and upload photo
          let imageUrl = null;
          if (details.photos && details.photos.length > 0) {
            const photoRef = details.photos[0].photo_reference;
            const googlePhotoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${GOOGLE_API_KEY}`;
            imageUrl = await downloadAndUploadImage(supabase, googlePhotoUrl, citySlug, restaurantSlug);
          }

          // Map price level
          const priceRangeMap: Record<number, string> = {
            1: '€',
            2: '€€',
            3: '€€€',
            4: '€€€€',
          };

          const normalizedRating = details.rating ? Math.round(details.rating) : null;

          // Insert restaurant
          const { data: newRestaurant, error: restaurantError } = await supabase
            .from('restaurants')
            .insert({
              google_place_id: place.place_id,
              name: details.name,
              slug: restaurantSlug,
              description: `${details.name} is een restaurant in ${cityData.name}. Bekijk onze reviews, menu en openingstijden.`,
              address: details.formatted_address?.split(',')[0] || '',
              postal_code: details.formatted_address?.match(/\d{4}\s?[A-Z]{2}/)?.[0] || null,
              city_id: cityId,
              latitude: details.geometry?.location?.lat || cityData.lat,
              longitude: details.geometry?.location?.lng || cityData.lng,
              phone: details.formatted_phone_number || null,
              website: details.website || null,
              price_range: details.price_level ? priceRangeMap[details.price_level] : null,
              rating: normalizedRating,
              review_count: details.user_ratings_total || 0,
              image_url: imageUrl,
              opening_hours: details.opening_hours?.weekday_text ? {} : null,
              features: [],
              meta_title: `${details.name} ${cityData.name} | ★ ${details.rating || 'N/A'}${details.price_level ? ' · ' + priceRangeMap[details.price_level] : ''} | Happio`,
              meta_description: `${details.name} in ${cityData.name}, ${cityData.province}. Beoordeling: ★ ${details.rating || 'N/A'}. Bekijk menu, openingstijden en reserveer online. ✓ Reviews ✓ Foto's`,
            })
            .select('id')
            .single();

          if (restaurantError) {
            console.error(`Error inserting restaurant ${details.name}:`, restaurantError);
            allErrors.push(`Restaurant ${details.name}: ${restaurantError.message}`);
            continue;
          }

          totalImportedRestaurants++;

          // Import Google reviews (max 5 per restaurant)
          if (details.reviews && details.reviews.length > 0 && newRestaurant) {
            for (const review of details.reviews.slice(0, 5)) {
              if (!review.text || review.text.trim().length === 0) continue;

              const { error: reviewError } = await supabase
                .from('reviews')
                .insert({
                  restaurant_id: newRestaurant.id,
                  rating: review.rating || 5,
                  content: review.text,
                  guest_name: review.author_name || 'Google Reviewer',
                  is_approved: true,
                  is_verified: true,
                  created_at: review.time ? new Date(review.time * 1000).toISOString() : new Date().toISOString(),
                });

              if (!reviewError) {
                totalImportedReviews++;
              }
            }
          }

          // Link cuisines based on Google types
          if (details.types && newRestaurant) {
            for (const type of details.types) {
              const cuisineSlug = CUISINE_MAPPING[type];
              if (cuisineSlug) {
                const { data: cuisine } = await supabase
                  .from('cuisine_types')
                  .select('id')
                  .eq('slug', cuisineSlug)
                  .maybeSingle();

                if (cuisine) {
                  await supabase
                    .from('restaurant_cuisines')
                    .insert({
                      restaurant_id: newRestaurant.id,
                      cuisine_id: cuisine.id,
                    })
                    .select();
                }
              }
            }
          }

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        }

      } catch (cityError: any) {
        console.error(`Error processing city ${cityData.name}:`, cityError);
        allErrors.push(`City ${cityData.name}: ${cityError.message || 'Unknown error'}`);
      }

      processedCities++;

      // Update progress in database every 5 cities
      if (processedCities % 5 === 0 || processedCities === DUTCH_CITIES.length) {
        await supabase
          .from('import_jobs')
          .update({
            processed_cities: processedCities,
            imported_restaurants: totalImportedRestaurants,
            imported_reviews: totalImportedReviews,
            skipped_restaurants: totalSkipped,
            errors: allErrors.slice(-50), // Keep last 50 errors
          })
          .eq('id', jobId);
      }
    }

    // Mark job as completed
    await supabase
      .from('import_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        processed_cities: processedCities,
        imported_restaurants: totalImportedRestaurants,
        imported_reviews: totalImportedReviews,
        skipped_restaurants: totalSkipped,
        errors: allErrors.slice(-50),
      })
      .eq('id', jobId);

    console.log(`Background import completed for job ${jobId}: ${totalImportedRestaurants} restaurants, ${totalImportedReviews} reviews`);

  } catch (error: any) {
    console.error(`Background import failed for job ${jobId}:`, error);
    await supabase
      .from('import_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        errors: [error.message || 'Unknown error'],
      })
      .eq('id', jobId);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!GOOGLE_API_KEY) {
      throw new Error('Google Places API key not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { action } = body;

    // Action: start - Start a new background import job
    if (action === 'start') {
      // Check if there's already a running job
      const { data: runningJob } = await supabase
        .from('import_jobs')
        .select('id')
        .eq('status', 'running')
        .maybeSingle();

      if (runningJob) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Er is al een import bezig',
            jobId: runningJob.id,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create new job
      const { data: newJob, error: jobError } = await supabase
        .from('import_jobs')
        .insert({
          status: 'pending',
          total_cities: DUTCH_CITIES.length,
        })
        .select('id')
        .single();

      if (jobError) {
        throw new Error(`Could not create job: ${jobError.message}`);
      }

      // Start background import using EdgeRuntime.waitUntil
      EdgeRuntime.waitUntil(runBackgroundImport(supabase, newJob.id, GOOGLE_API_KEY));

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Import gestart op de achtergrond',
          jobId: newJob.id,
          totalCities: DUTCH_CITIES.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: status - Get current job status
    if (action === 'status') {
      const { data: latestJob, error } = await supabase
        .from('import_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw new Error(`Could not get status: ${error.message}`);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          job: latestJob,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Legacy batch mode for backwards compatibility
    const { startIndex = 0, batchSize = 5 } = body;

    // Get cities to process in this batch
    const citiesToProcess = DUTCH_CITIES.slice(startIndex, startIndex + batchSize);
    
    if (citiesToProcess.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Alle steden zijn verwerkt!',
          completed: true,
          totalCities: DUTCH_CITIES.length,
          apiCallsThisBatch: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: any[] = [];
    let apiCallsThisBatch = 0;

    for (const cityData of citiesToProcess) {
      console.log(`Processing city: ${cityData.name}`);
      
      // Create or get city
      const citySlug = createSlug(cityData.name);
      let cityId: string;

      const { data: existingCity } = await supabase
        .from('cities')
        .select('id')
        .eq('slug', citySlug)
        .maybeSingle();

      if (existingCity) {
        cityId = existingCity.id;
      } else {
        const { data: newCity, error: cityError } = await supabase
          .from('cities')
          .insert({
            name: cityData.name,
            slug: citySlug,
            province: cityData.province,
            latitude: cityData.lat,
            longitude: cityData.lng,
            description: `Ontdek de beste restaurants in ${cityData.name}, ${cityData.province}. Van gezellige eetcafés tot fine dining.`,
            meta_title: `Beste Restaurants ${cityData.name} | Reviews & Menu's | Happio`,
            meta_description: `Vind de ${cityData.name} beste restaurants. Lees reviews, bekijk menu's en reserveer direct. ✓ Actuele openingstijden ✓ Foto's ✓ Beoordelingen`,
          })
          .select('id')
          .single();

        if (cityError) {
          console.error(`Error creating city ${cityData.name}:`, cityError);
          continue;
        }
        cityId = newCity.id;
      }

      // Search for restaurants in this city - 1 API call
      const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${cityData.lat},${cityData.lng}&radius=5000&type=restaurant&key=${GOOGLE_API_KEY}`;
      
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      apiCallsThisBatch++;

      if (searchData.status !== 'OK' || !searchData.results) {
        console.log(`No results for ${cityData.name}: ${searchData.status}`);
        results.push({ city: cityData.name, imported: 0, error: searchData.status, apiCalls: 1 });
        continue;
      }

      // Excluded types (hotels, B&Bs, etc.)
      const excludedTypes = ['lodging', 'hotel', 'bed_and_breakfast', 'guest_house', 'campground', 'rv_park', 'motel'];
      
      // Get top 5 restaurants by rating, excluding hotels/B&Bs
      const topRestaurants = searchData.results
        .filter((r: any) => {
          // Must have minimum rating
          if (r.rating < 3.5) return false;
          // Exclude if any of the types match excluded types
          if (r.types && r.types.some((t: string) => excludedTypes.includes(t))) {
            console.log(`Skipping ${r.name} - is a hotel/B&B`);
            return false;
          }
          return true;
        })
        .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 5);

      let importedCount = 0;
      let cityApiCalls = 1; // Already counted the search call

      for (const place of topRestaurants) {
        // Check if already exists
        const { data: existing } = await supabase
          .from('restaurants')
          .select('id')
          .eq('google_place_id', place.place_id)
          .maybeSingle();

        if (existing) {
          console.log(`Restaurant ${place.name} already exists, skipping`);
          continue;
        }

        // Get place details with reviews - 1 API call per restaurant
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,opening_hours,price_level,rating,user_ratings_total,photos,types,geometry,reviews&key=${GOOGLE_API_KEY}`;
        
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();
        apiCallsThisBatch++;
        cityApiCalls++;

        if (detailsData.status !== 'OK') {
          console.log(`Could not get details for ${place.name}`);
          continue;
        }

        const details = detailsData.result;
        const restaurantSlug = createSlug(details.name);

        // Download and upload photo - 1 API call if photo exists
        let imageUrl = null;
        if (details.photos && details.photos.length > 0) {
          const photoRef = details.photos[0].photo_reference;
          const googlePhotoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${GOOGLE_API_KEY}`;
          imageUrl = await downloadAndUploadImage(supabase, googlePhotoUrl, citySlug, restaurantSlug);
          apiCallsThisBatch++;
          cityApiCalls++;
        }

        // Map price level
        const priceRangeMap: Record<number, string> = {
          1: '€',
          2: '€€',
          3: '€€€',
          4: '€€€€',
        };

        // Normalize rating to 1-5 scale
        const normalizedRating = details.rating ? Math.round(details.rating) : null;

        // Insert restaurant
        const { data: newRestaurant, error: restaurantError } = await supabase
          .from('restaurants')
          .insert({
            google_place_id: place.place_id,
            name: details.name,
            slug: restaurantSlug,
            description: `${details.name} is een restaurant in ${cityData.name}. Bekijk onze reviews, menu en openingstijden.`,
            address: details.formatted_address?.split(',')[0] || '',
            postal_code: details.formatted_address?.match(/\d{4}\s?[A-Z]{2}/)?.[0] || null,
            city_id: cityId,
            latitude: details.geometry?.location?.lat || cityData.lat,
            longitude: details.geometry?.location?.lng || cityData.lng,
            phone: details.formatted_phone_number || null,
            website: details.website || null,
            price_range: details.price_level ? priceRangeMap[details.price_level] : null,
            rating: normalizedRating,
            review_count: details.user_ratings_total || 0,
            image_url: imageUrl,
            opening_hours: details.opening_hours?.weekday_text ? {} : null,
            features: [],
            meta_title: `${details.name} ${cityData.name} | ★ ${details.rating || 'N/A'}${details.price_level ? ' · ' + priceRangeMap[details.price_level] : ''} | Happio`,
            meta_description: `${details.name} in ${cityData.name}, ${cityData.province}. Beoordeling: ★ ${details.rating || 'N/A'}. Bekijk menu, openingstijden en reserveer online. ✓ Reviews ✓ Foto's`,
          })
          .select('id')
          .single();

        if (restaurantError) {
          console.error(`Error inserting restaurant ${details.name}:`, restaurantError);
          continue;
        }

        // Import Google reviews (max 5 per restaurant)
        let reviewsImported = 0;
        if (details.reviews && details.reviews.length > 0 && newRestaurant) {
          for (const review of details.reviews.slice(0, 5)) {
            // Skip reviews without content
            if (!review.text || review.text.trim().length === 0) continue;

            const { error: reviewError } = await supabase
              .from('reviews')
              .insert({
                restaurant_id: newRestaurant.id,
                rating: review.rating || 5,
                content: review.text,
                guest_name: review.author_name || 'Google Reviewer',
                is_approved: true, // Auto-approve Google reviews
                is_verified: true, // Mark as verified (from Google)
                created_at: review.time ? new Date(review.time * 1000).toISOString() : new Date().toISOString(),
              });

            if (!reviewError) {
              reviewsImported++;
            } else {
              console.error(`Error inserting review for ${details.name}:`, reviewError);
            }
          }
          console.log(`  → ${reviewsImported} reviews imported for ${details.name}`);
        }

        // Link cuisines based on Google types
        if (details.types && newRestaurant) {
          for (const type of details.types) {
            const cuisineSlug = CUISINE_MAPPING[type];
            if (cuisineSlug) {
              const { data: cuisine } = await supabase
                .from('cuisine_types')
                .select('id')
                .eq('slug', cuisineSlug)
                .maybeSingle();

              if (cuisine) {
                await supabase
                  .from('restaurant_cuisines')
                  .insert({
                    restaurant_id: newRestaurant.id,
                    cuisine_id: cuisine.id,
                  })
                  .select();
              }
            }
          }
        }

        importedCount++;
        console.log(`Imported: ${details.name} in ${cityData.name}`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      results.push({ city: cityData.name, imported: importedCount, apiCalls: cityApiCalls });
    }

    const nextIndex = startIndex + batchSize;
    const hasMore = nextIndex < DUTCH_CITIES.length;

    return new Response(
      JSON.stringify({
        success: true,
        results,
        nextIndex: hasMore ? nextIndex : null,
        hasMore,
        processed: Math.min(nextIndex, DUTCH_CITIES.length),
        totalCities: DUTCH_CITIES.length,
        apiCallsThisBatch,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Bulk import error:', error);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
