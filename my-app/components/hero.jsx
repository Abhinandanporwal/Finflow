"use client";
import React, { useEffect, useRef } from 'react'
import { Button } from './ui/button';
import Link from 'next/link';
import Image from 'next/image';
// hero section is a section which user see when he land on the site 
const HeroSection = () => {
    // this is a react hook function which allow us to use special features that are available in the reat like state/lifecyle methods
    const imageRef=useRef();
    useEffect(()=>{
        const imageElement =imageRef.current;
        const handleScroll=()=>{
            const scrollPosition=window.scrollY;
            const scrollThreshold=100;
            if(scrollPosition>scrollThreshold){
                imageElement.classList.add("scrolled");
        }
            else{
                imageElement.classList.remove("scrolled");
            }
    };
    window.addEventListener("scroll",handleScroll);
    return ()=>window.removeEventListener("scroll",handleScroll);
},[]);
  return (
    <div className='pb-20 px-4'>
        <div className='container mx-auto text center'>
            <h1 className='text-5xl md:text-8xl lg:text-[105]px pb-6 gradient-text text-center'>
            Finances Made Simple,<br/> One Click Away
            </h1>
            <p className='text-xl text-gray-600 mb-8 max-w-2xl mx-auto text-center dark:text-white'>
            Smart finance made easy! Get real-time insights to track, analyze, and optimize your spending effortlessly.
            </p>
            <div className='flex space-x-4 justify-center mt-4'>
                <Link href="/dashboard">
                <Button size='lg' className='px-8'>Get Started</Button>
                </Link>
                <Link href="/dashboard">
                <Button size='lg' variant="outline" className='px-8'>Watch Demo</Button>
                </Link>
            </div>
            <div className='hero-image-wrapper'>
                <div ref={imageRef} className='hero-image'>
                    <Image src={"/banner.jpg"}
                        alt='Dashboard Preview'
                        width={1280}
                        height={720}
                        className='rounded-lg shadow-2xl border mx-auto'/>
                </div>
            </div>
        </div>
    </div>
  )
}

export default HeroSection;