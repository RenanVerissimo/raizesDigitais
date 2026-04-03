import svgPaths from "./svg-vudnsggqw4";

function Heading1() {
  return (
    <div className="absolute h-[59.977px] left-0 top-0 w-[221.772px]" data-name="Heading 2">
      <p className="absolute font-['Arimo:Regular',sans-serif] font-normal leading-[30px] left-0 text-[#f54900] text-[20px] top-[-2.79px] w-[167px]">Gerenciamento de Cultivos</p>
    </div>
  );
}

function Paragraph() {
  return (
    <div className="absolute h-[23.987px] left-0 top-[59.98px] w-[221.772px]" data-name="Paragraph">
      <p className="absolute font-['Arimo:Regular',sans-serif] font-normal leading-[24px] left-0 text-[#4a5565] text-[16px] text-nowrap top-[-1.79px] whitespace-pre">Acompanhe suas plantações</p>
    </div>
  );
}

function Container() {
  return (
    <div className="h-[83.964px] relative shrink-0 w-[221.772px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[83.964px] relative w-[221.772px]">
        <Heading1 />
        <Paragraph />
      </div>
    </div>
  );
}

function Icon() {
  return (
    <div className="absolute left-[11.98px] size-[15.998px] top-[10px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d="M3.33285 7.99885H12.6648" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33314" />
          <path d="M7.99884 3.33285V12.6648" id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33314" />
        </g>
      </svg>
    </div>
  );
}

function Button() {
  return (
    <div className="bg-[#ff6900] h-[35.99px] relative rounded-[8px] shrink-0 w-[138.811px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[35.99px] relative w-[138.811px]">
        <Icon />
        <p className="absolute font-['Arimo:Regular',sans-serif] font-normal leading-[20px] left-[43.96px] text-[14px] text-nowrap text-white top-[6.01px] whitespace-pre">Novo Cultivo</p>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex h-[83.964px] items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Container />
      <Button />
    </div>
  );
}

function Icon1() {
  return (
    <div className="relative shrink-0 size-[47.993px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 48 48">
        <g id="Icon">
          <path d={svgPaths.p3d1db180} id="Vector" stroke="var(--stroke-0, #D1D5DC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.99943" />
          <path d={svgPaths.p10208580} id="Vector_2" stroke="var(--stroke-0, #D1D5DC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.99943" />
          <path d="M9.99856 41.9939H37.9945" id="Vector_3" stroke="var(--stroke-0, #D1D5DC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.99943" />
        </g>
      </svg>
    </div>
  );
}

function CropsManagement() {
  return (
    <div className="h-[23.987px] relative shrink-0 w-[237.448px]" data-name="CropsManagement">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[23.987px] relative w-[237.448px]">
        <p className="absolute font-['Arimo:Regular',sans-serif] font-normal leading-[24px] left-0 text-[#6a7282] text-[16px] text-nowrap top-[-1.79px] whitespace-pre">Nenhum cultivo cadastrado ainda</p>
      </div>
    </div>
  );
}

function CropsManagement1() {
  return (
    <div className="h-[19.974px] relative shrink-0 w-[244.85px]" data-name="CropsManagement">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex h-[19.974px] items-start relative w-[244.85px]">
        <p className="font-['Arimo:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[#99a1af] text-[14px] text-nowrap whitespace-pre">{`Clique em "Novo Cultivo" para começar`}</p>
      </div>
    </div>
  );
}

function CardContent() {
  return (
    <div className="h-[179.932px] relative shrink-0 w-[358.159px]" data-name="CardContent">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[15.998px] h-[179.932px] items-center justify-center pb-0 pt-[24.006px] px-0 relative w-[358.159px]">
        <Icon1 />
        <CropsManagement />
        <CropsManagement1 />
      </div>
    </div>
  );
}

function Card() {
  return (
    <div className="bg-white h-[182.355px] relative rounded-[14px] shrink-0 w-full" data-name="Card">
      <div aria-hidden="true" className="absolute border-[1.212px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[14px]" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col h-[182.355px] items-start p-[1.212px] relative w-full">
          <CardContent />
        </div>
      </div>
    </div>
  );
}

function CropsManagement2() {
  return (
    <div className="content-stretch flex flex-col gap-[23.987px] h-[290.306px] items-start relative shrink-0 w-full" data-name="CropsManagement">
      <Container1 />
      <Card />
    </div>
  );
}

function MainApp() {
  return (
    <div className="absolute box-border content-stretch flex flex-col h-[851.797px] items-start left-0 pb-0 pt-[97.198px] px-[15.998px] top-0 w-[392.578px]" data-name="MainApp">
      <CropsManagement2 />
    </div>
  );
}

function Text() {
  return <div className="absolute left-0 opacity-0 size-0 top-0" data-name="Text" />;
}

function Text1() {
  return <div className="absolute left-0 opacity-0 size-0 top-[851.8px]" data-name="Text" />;
}

function Icon2() {
  return (
    <div className="relative shrink-0 size-[23.987px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Icon">
          <path d={svgPaths.p202a5900} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.99892" />
          <path d={svgPaths.p22cfe00} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.99892" />
          <path d="M4.99731 20.9887H18.9898" id="Vector_3" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.99892" />
        </g>
      </svg>
    </div>
  );
}

function Container2() {
  return (
    <div className="bg-[#ff6900] relative rounded-[4.06566e+07px] shrink-0 size-[39.985px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex items-center justify-center pl-0 pr-[0.019px] py-0 relative size-[39.985px]">
        <Icon2 />
      </div>
    </div>
  );
}

function Heading() {
  return (
    <div className="h-[23.987px] relative shrink-0 w-full" data-name="Heading 1">
      <p className="absolute font-['Arimo:Regular',sans-serif] font-normal leading-[24px] left-0 text-[#f54900] text-[16px] text-nowrap top-[-1.79px] whitespace-pre">AgroGestão</p>
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="h-[15.998px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Arimo:Regular',sans-serif] font-normal leading-[16px] left-0 text-[#4a5565] text-[12px] top-[-1px] w-[57px]">Olá, Renan</p>
    </div>
  );
}

function Container3() {
  return (
    <div className="h-[39.985px] relative shrink-0 w-[83.718px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[9.537e_-7px] h-[39.985px] items-start relative w-[83.718px]">
        <Heading />
        <Paragraph1 />
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div className="h-[39.985px] relative shrink-0 w-[135.687px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[11.984px] h-[39.985px] items-center relative w-[135.687px]">
        <Container2 />
        <Container3 />
      </div>
    </div>
  );
}

function Icon3() {
  return (
    <div className="h-[23.987px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[20.83%_16.67%_79.17%_16.67%]" data-name="Vector">
        <div className="absolute inset-[-1px_-6.25%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 2">
            <path d="M0.999462 0.999462H16.9909" id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.99892" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-1/2 left-[16.67%] right-[16.67%] top-1/2" data-name="Vector">
        <div className="absolute inset-[-1px_-6.25%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 2">
            <path d="M0.999462 0.999462H16.9909" id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.99892" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[79.17%_16.67%_20.83%_16.67%]" data-name="Vector">
        <div className="absolute inset-[-1px_-6.25%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 2">
            <path d="M0.999462 0.999462H16.9909" id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.99892" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Button1() {
  return (
    <div className="relative shrink-0 size-[39.966px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col items-start pb-0 pt-[7.989px] px-[7.989px] relative size-[39.966px]">
        <Icon3 />
      </div>
    </div>
  );
}

function Container5() {
  return (
    <div className="content-stretch flex h-[63.991px] items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Container4 />
      <Button1 />
    </div>
  );
}

function MainApp1() {
  return (
    <div className="absolute bg-white box-border content-stretch flex flex-col h-[65.203px] items-start left-0 pb-[1.212px] pt-0 px-[15.998px] top-0 w-[392.578px]" data-name="MainApp">
      <div aria-hidden="true" className="absolute border-[0px_0px_1.212px] border-gray-200 border-solid inset-0 pointer-events-none" />
      <Container5 />
    </div>
  );
}

function PrimitiveDiv() {
  return <div className="absolute bg-[rgba(0,0,0,0.5)] h-[851.797px] left-0 top-0 w-[392.578px]" data-name="Primitive.div" />;
}

function PrimitiveH() {
  return (
    <div className="h-[18.005px] relative shrink-0 w-[310.166px]" data-name="Primitive.h2">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[18.005px] relative w-[310.166px]">
        <p className="absolute font-['Arimo:Bold',sans-serif] font-bold leading-[18px] left-[154.8px] text-[18px] text-center text-neutral-950 text-nowrap top-[-1.64px] translate-x-[-50%] whitespace-pre">Novo Cultivo</p>
      </div>
    </div>
  );
}

function PrimitiveP() {
  return (
    <div className="h-[19.974px] relative shrink-0 w-[310.166px]" data-name="Primitive.p">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex h-[19.974px] items-start relative w-[310.166px]">
        <p className="basis-0 font-['Arimo:Regular',sans-serif] font-normal grow leading-[20px] min-h-px min-w-px relative shrink-0 text-[#717182] text-[14px] text-center">Registre uma nova plantação</p>
      </div>
    </div>
  );
}

function DialogHeader() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[7.989px] h-[45.967px] items-start left-[25.2px] top-[25.2px] w-[310.166px]" data-name="DialogHeader">
      <PrimitiveH />
      <PrimitiveP />
    </div>
  );
}

function PrimitiveLabel() {
  return (
    <div className="content-stretch flex gap-[8px] h-[13.991px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Arimo:Regular',sans-serif] font-normal leading-[14px] relative shrink-0 text-[14px] text-neutral-950 text-nowrap whitespace-pre">Área</p>
    </div>
  );
}

function PrimitiveSpan() {
  return (
    <div className="h-[19.974px] relative shrink-0 w-[99.981px]" data-name="Primitive.span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[8px] h-[19.974px] items-center overflow-clip relative rounded-[inherit] w-[99.981px]">
        <p className="font-['Arimo:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[#717182] text-[14px] text-nowrap whitespace-pre">Selecione a área</p>
      </div>
    </div>
  );
}

function Icon4() {
  return (
    <div className="relative shrink-0 size-[15.998px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon" opacity="0.5">
          <path d={svgPaths.p152d3600} id="Vector" stroke="var(--stroke-0, #717182)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33314" />
        </g>
      </svg>
    </div>
  );
}

function PrimitiveButton() {
  return (
    <div className="bg-[#f3f3f5] h-[35.99px] relative rounded-[8px] shrink-0 w-full" data-name="Primitive.button">
      <div aria-hidden="true" className="absolute border-[1.212px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex h-[35.99px] items-center justify-between px-[13.196px] py-[1.212px] relative w-full">
          <PrimitiveSpan />
          <Icon4 />
        </div>
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="content-stretch flex flex-col gap-[7.989px] h-[57.97px] items-start relative shrink-0 w-full" data-name="Container">
      <PrimitiveLabel />
      <PrimitiveButton />
    </div>
  );
}

function PrimitiveLabel1() {
  return (
    <div className="content-stretch flex gap-[8px] h-[13.991px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Arimo:Regular',sans-serif] font-normal leading-[14px] relative shrink-0 text-[14px] text-neutral-950 text-nowrap whitespace-pre">Nome da Cultura</p>
    </div>
  );
}

function Input() {
  return (
    <div className="bg-[#f3f3f5] h-[35.99px] relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex h-[35.99px] items-center px-[12px] py-[4px] relative w-full">
          <p className="font-['Arimo:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[#717182] text-[16px] text-nowrap whitespace-pre">Ex: Milho, Soja, Café</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[1.212px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Container7() {
  return (
    <div className="content-stretch flex flex-col gap-[7.989px] h-[57.97px] items-start relative shrink-0 w-full" data-name="Container">
      <PrimitiveLabel1 />
      <Input />
    </div>
  );
}

function PrimitiveLabel2() {
  return (
    <div className="content-stretch flex gap-[8px] h-[13.991px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Arimo:Regular',sans-serif] font-normal leading-[14px] relative shrink-0 text-[14px] text-neutral-950 text-nowrap whitespace-pre">Data de Plantio</p>
    </div>
  );
}

function Input1() {
  return (
    <div className="bg-[#f3f3f5] h-[35.99px] relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div aria-hidden="true" className="absolute border-[1.212px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Container8() {
  return (
    <div className="content-stretch flex flex-col gap-[7.989px] h-[57.97px] items-start relative shrink-0 w-full" data-name="Container">
      <PrimitiveLabel2 />
      <Input1 />
    </div>
  );
}

function PrimitiveLabel3() {
  return (
    <div className="content-stretch flex gap-[8px] h-[13.991px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Arimo:Regular',sans-serif] font-normal leading-[14px] relative shrink-0 text-[14px] text-neutral-950 text-nowrap whitespace-pre">Previsão de Colheita</p>
    </div>
  );
}

function Input2() {
  return (
    <div className="bg-[#f3f3f5] h-[35.99px] relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div aria-hidden="true" className="absolute border-[1.212px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Container9() {
  return (
    <div className="content-stretch flex flex-col gap-[7.989px] h-[57.97px] items-start relative shrink-0 w-full" data-name="Container">
      <PrimitiveLabel3 />
      <Input2 />
    </div>
  );
}

function Button2() {
  return (
    <div className="bg-[#ff6900] h-[35.99px] relative rounded-[8px] shrink-0 w-full" data-name="Button">
      <p className="absolute font-['Arimo:Regular',sans-serif] font-normal leading-[20px] left-[124.82px] text-[14px] text-nowrap text-white top-[6.01px] whitespace-pre">Cadastrar</p>
    </div>
  );
}

function CropsManagement3() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[15.998px] h-[331.862px] items-start left-[25.2px] top-[87.16px] w-[310.166px]" data-name="CropsManagement">
      <Container6 />
      <Container7 />
      <Container8 />
      <Container9 />
      <Button2 />
    </div>
  );
}

function Icon5() {
  return (
    <div className="absolute left-0 size-[15.998px] top-0" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d={svgPaths.pdf7a000} id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33314" />
          <path d={svgPaths.p2089e100} id="Vector_2" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33314" />
        </g>
      </svg>
    </div>
  );
}

function DialogContent() {
  return (
    <div className="absolute left-[-0.98px] overflow-clip size-[0.984px] top-[15.01px]" data-name="DialogContent">
      <p className="absolute font-['Arimo:Regular',sans-serif] font-normal leading-[24px] left-0 text-[16px] text-neutral-950 text-nowrap top-[-1.79px] whitespace-pre">Close</p>
    </div>
  );
}

function PrimitiveButton1() {
  return (
    <div className="absolute left-[327.36px] opacity-70 rounded-[2px] size-[15.998px] top-[17.21px]" data-name="Primitive.button">
      <Icon5 />
      <DialogContent />
    </div>
  );
}

function PrimitiveDiv1() {
  return (
    <div className="absolute bg-white h-[444.225px] left-[16.01px] rounded-[10px] top-[203.79px] w-[360.564px]" data-name="Primitive.div">
      <div aria-hidden="true" className="absolute border-[1.212px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[10px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]" />
      <DialogHeader />
      <CropsManagement3 />
      <PrimitiveButton1 />
    </div>
  );
}

export default function AgricultureManagementApp() {
  return (
    <div className="bg-white relative size-full" data-name="Agriculture Management App">
      <MainApp />
      <Text />
      <Text1 />
      <MainApp1 />
      <PrimitiveDiv />
      <PrimitiveDiv1 />
    </div>
  );
}