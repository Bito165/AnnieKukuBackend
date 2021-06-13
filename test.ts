
export class test {
    tokens: Array<string> = [];

    findTokens(sentence: string){

        //declare a variable to hold words
        let holder = [];

        //loop through string supplied as parameter
        for (let i = 0; i < sentence.length; i++) {
            //check if index is a white space
            if(sentence[i] === ' ' && holder.length > 0){
                //check if holder variable contains any double quotes
                for(let j = 0; i < holder.length; j++){
                    //if holder contains double quotes skip to next index
                    if(holder[j] === '"'){
                        return;
                    }else{
                        //if holder doesn't have double quotes push holder into tokens
                        // and clear holder
                        // @ts-ignore
                        this.tokens.push(holder)
                        holder = [];
                    }
                }
            }
            else{
                //push letter into holder
                holder.push(sentence[i]);
            }
        }

        console.log(this.tokens);
    }
}



