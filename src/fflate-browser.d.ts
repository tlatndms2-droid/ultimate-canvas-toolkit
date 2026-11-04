// fflate exposes identical browser APIs through package exports, which the
// project's legacy Node module resolver does not read.
declare module 'fflate/browser' {
 export {Zip,zip,unzip,strToU8,strFromU8,type ZipInputFile} from 'fflate';
}
