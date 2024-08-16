
import object from './austin_data.json';
import { Data } from './Data';


const main = () => {

    const copy = [...object as unknown as Data[]];

    copy.sort((a: Data, b: Data) => {
        return b.rows * b.columns - a.rows * a.columns ;
    })

    console.log(copy.slice(0, 5));

    copy.sort((a: Data, b: Data) => {
        return b.views - a.views;
    })
    console.log(copy.slice(0, 5));

}

main();
