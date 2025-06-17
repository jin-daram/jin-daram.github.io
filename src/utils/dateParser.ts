const parse = (input: string) => {
    const date = new Date(input);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");

    const formatted = `${yyyy}년 ${mm}월 ${dd}일`;
    return formatted;   
}

export default parse;